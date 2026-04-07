// Supabase Edge Function: send-social-notification
// Triggered by database webhooks on follows, post_likes, and post_comments inserts.
// Resolves target kitchen to user push tokens and sends Expo push notifications.
// Self-notification prevention ensures acting user does not receive their own notification.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface WebhookPayload {
  type: string;
  table: 'follows' | 'post_likes' | 'post_comments';
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

interface NotificationDetails {
  actorKitchenId: string;
  targetKitchenId: string;
  message: string;
  postId: string | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('SOCIAL_WEBHOOK_SECRET');
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate webhook payload
    const payload: WebhookPayload = await req.json();
    const { table, record } = payload;

    if (!table || !record) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload: missing table or record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin Supabase client (service_role for read queries)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine notification details based on event type
    let details: NotificationDetails;

    switch (table) {
      case 'follows': {
        details = {
          actorKitchenId: record.follower_kitchen_id as string,
          targetKitchenId: record.following_kitchen_id as string,
          message: 'started following you',
          postId: null,
        };
        break;
      }

      case 'post_likes': {
        // Look up feed_post to get target kitchen
        const { data: post, error: postErr } = await supabaseAdmin
          .from('feed_posts')
          .select('kitchen_id')
          .eq('id', record.post_id as string)
          .single();

        if (postErr || !post) {
          console.error('Failed to look up feed_post for post_likes:', postErr?.message);
          return new Response(
            JSON.stringify({ error: 'Feed post not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        details = {
          actorKitchenId: record.kitchen_id as string,
          targetKitchenId: post.kitchen_id,
          message: 'liked your meal',
          postId: record.post_id as string,
        };
        break;
      }

      case 'post_comments': {
        // Look up feed_post to get target kitchen
        const { data: post, error: postErr } = await supabaseAdmin
          .from('feed_posts')
          .select('kitchen_id')
          .eq('id', record.post_id as string)
          .single();

        if (postErr || !post) {
          console.error('Failed to look up feed_post for post_comments:', postErr?.message);
          return new Response(
            JSON.stringify({ error: 'Feed post not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        details = {
          actorKitchenId: record.kitchen_id as string,
          targetKitchenId: post.kitchen_id,
          message: 'commented on your meal',
          postId: record.post_id as string,
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported table: ${table}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Self-notification prevention (kitchen level)
    if (details.actorKitchenId === details.targetKitchenId) {
      return new Response(
        JSON.stringify({ skipped: 'self-action' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve actor kitchen display name
    const { data: actorKitchen } = await supabaseAdmin
      .from('kitchen_profiles')
      .select('display_name, household_id')
      .eq('id', details.actorKitchenId)
      .single();

    const actorName = actorKitchen?.display_name ?? 'Someone';

    // Resolve target kitchen's household users
    const { data: targetKitchen } = await supabaseAdmin
      .from('kitchen_profiles')
      .select('household_id')
      .eq('id', details.targetKitchenId)
      .single();

    if (!targetKitchen?.household_id) {
      return new Response(
        JSON.stringify({ sent: 0, reason: 'target kitchen has no household' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: targetMembers } = await supabaseAdmin
      .from('household_members')
      .select('user_id')
      .eq('household_id', targetKitchen.household_id);

    const targetUserIds = (targetMembers ?? []).map((m) => m.user_id);

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: 'no target users found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve actor household users for user-level self-notification prevention
    let actorUserIds: string[] = [];
    if (actorKitchen?.household_id) {
      const { data: actorMembers } = await supabaseAdmin
        .from('household_members')
        .select('user_id')
        .eq('household_id', actorKitchen.household_id);

      actorUserIds = (actorMembers ?? []).map((m) => m.user_id);
    }

    // Filter out actor users from target users (user-level self-prevention)
    const recipientUserIds = targetUserIds.filter((id) => !actorUserIds.includes(id));

    if (recipientUserIds.length === 0) {
      return new Response(
        JSON.stringify({ skipped: 'self-action', reason: 'all target users are actor users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch push tokens for recipient users
    const { data: tokens } = await supabaseAdmin
      .from('push_tokens')
      .select('expo_push_token')
      .in('user_id', recipientUserIds);

    const pushTokens = (tokens ?? []).map((t) => t.expo_push_token);

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: 'no push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Expo push notification messages
    const messages = pushTokens.map((token) => ({
      to: token,
      title: 'SharedKitchen',
      body: `${actorName} ${details.message}`,
      data: {
        type: 'social',
        table,
        postId: details.postId,
      },
      sound: 'default' as const,
    }));

    // Send via Expo Push API
    try {
      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!expoResponse.ok) {
        const errText = await expoResponse.text();
        console.error(`Expo Push API error: status=${expoResponse.status} body=${errText.slice(0, 300)}`);
      }
    } catch (expoErr: unknown) {
      const errMsg = expoErr instanceof Error ? expoErr.message : String(expoErr);
      console.error('Expo Push API request failed:', errMsg);
      // Don't throw - notification delivery failure should not cause webhook failure
    }

    return new Response(
      JSON.stringify({ sent: pushTokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('send-social-notification error:', errMsg);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
