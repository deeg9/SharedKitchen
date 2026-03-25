// Supabase Edge Function: stripe-webhooks
// Handles Stripe subscription lifecycle events with signature verification.
// Idempotent processing via processed_webhook_events table (PAY-03).
// verify_jwt = false in config.toml -- security via Stripe signature verification.

import Stripe from 'https://esm.sh/stripe@17?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20',
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('Stripe-Signature')
  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing Stripe-Signature header' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use service_role key to bypass RLS for writes
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  console.log(`Processing webhook event: ${event.type} (${event.id})`)

  // PAY-03: Idempotent processing -- check if this event was already processed
  const { data: existingEvent } = await supabaseAdmin
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`)
    return new Response(
      JSON.stringify({ received: true, duplicate: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.user_id
        if (!userId) {
          console.error('checkout.session.completed missing user_id in metadata')
          break
        }

        // Retrieve the full subscription to get period dates
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            price_id: subscription.items.data[0]?.price?.id ?? null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (error) console.error('Error upserting subscription:', error)
        else console.log(`Subscription activated for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        // Map Stripe status to our status enum
        let status: string
        switch (subscription.status) {
          case 'active': status = 'active'; break
          case 'past_due': status = 'past_due'; break
          case 'canceled':
          case 'unpaid': status = 'canceled'; break
          case 'trialing': status = 'trialing'; break
          default: status = 'free'; break
        }

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            price_id: subscription.items.data[0]?.price?.id ?? null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('Error updating subscription:', error)
        else console.log(`Subscription ${subscriptionId} updated to ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Error canceling subscription:', error)
        else console.log(`Subscription ${subscription.id} canceled`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('Error marking subscription past_due:', error)
        else console.log(`Subscription ${subscriptionId} marked past_due`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // PAY-03: Record event as processed for idempotency
    await supabaseAdmin
      .from('processed_webhook_events')
      .insert({ event_id: event.id, event_type: event.type })
      .then(({ error }) => {
        if (error) console.error('Error recording processed event:', error)
      })

  } catch (err) {
    console.error('Error processing webhook event:', err)
    // Still return 200 to prevent Stripe retries for processing errors
    // (signature was valid, we just couldn't process)
  }

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
