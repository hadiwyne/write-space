-- Add target_user_id to series_invite_tokens so invites are user-specific
ALTER TABLE "series_invite_tokens" ADD COLUMN IF NOT EXISTS "target_user_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE;

-- Add series_id and invite_token to notifications for series invite flow
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "series_id" TEXT REFERENCES "series"("id") ON DELETE SET NULL;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "invite_token" TEXT;
