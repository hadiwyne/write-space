-- Add avatar storage in DB (no external storage / credit card required)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_data" BYTEA;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_mime_type" TEXT;
