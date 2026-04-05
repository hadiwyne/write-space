-- Align series table with schema: background image + focal points
ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "bg_image_data" BYTEA;
ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "bg_image_mime_type" TEXT;
ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "cover_focal_y" DOUBLE PRECISION;
ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "social_focal_y" DOUBLE PRECISION;
