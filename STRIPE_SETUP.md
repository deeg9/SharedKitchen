# Stripe Test Mode Setup

## Prerequisites

- Stripe account (https://dashboard.stripe.com/register)
- Supabase CLI installed (`supabase --version`)
- Stripe CLI installed (`stripe --version`)

## 1. Get Test API Keys

- Go to Stripe Dashboard > Developers > API Keys
- Copy Publishable key (`pk_test_...`) and Secret key (`sk_test_...`)

## 2. Create a Product and Price

- Go to Stripe Dashboard > Products > Add Product
- Name: "Mise Premium", Price: $9.99/month recurring
- Copy the Price ID (`price_...`)

## 3. Configure Client Environment

Add to your `.env` file:

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
EXPO_PUBLIC_STRIPE_PRICE_ID=price_your-price-id
```

## 4. Set Supabase Edge Function Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key
supabase secrets set STRIPE_PRICE_ID=price_your-price-id
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_your-signing-secret
```

Note: SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

## 5. Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhooks
supabase functions deploy create-billing-portal
```

## 6. Configure Webhook Endpoint

- Go to Stripe Dashboard > Developers > Webhooks > Add endpoint
- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhooks`
- Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- Copy the Signing secret (`whsec_...`) and update the secret from step 4

## 7. Configure Customer Portal

- Go to Stripe Dashboard > Settings > Billing > Customer portal
- Enable portal and save

## 8. Local Testing with Stripe CLI

```bash
# Forward webhooks to local Supabase
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhooks

# Use the provided webhook signing secret for local testing
```

## Test Card Numbers

- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires auth: 4000 0025 0000 3155
