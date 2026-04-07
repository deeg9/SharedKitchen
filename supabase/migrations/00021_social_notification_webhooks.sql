-- Social notification webhooks -- triggers Edge Function on follow/like/comment inserts
-- Uses pg_net extension for async HTTP POST to send-social-notification Edge Function

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function that sends webhook to Edge Function
CREATE OR REPLACE FUNCTION notify_social_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
  webhook_secret text;
BEGIN
  -- Build payload matching Edge Function expected format
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', null
  );

  -- Resolve Edge Function URL and webhook secret from app settings
  edge_function_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/send-social-notification';
  webhook_secret := current_setting('app.settings.social_webhook_secret', true);

  -- Use pg_net to make async HTTP POST (does not block the insert transaction)
  PERFORM net.http_post(
    url := edge_function_url,
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger on new follows
CREATE TRIGGER on_new_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_social_event();

-- Trigger on new post likes
CREATE TRIGGER on_new_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_social_event();

-- Trigger on new post comments
CREATE TRIGGER on_new_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_social_event();
