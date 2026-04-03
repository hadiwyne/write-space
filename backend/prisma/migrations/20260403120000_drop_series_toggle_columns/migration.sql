-- Drop unused toggle columns from series table
ALTER TABLE "series" DROP COLUMN IF EXISTS "show_top_posts";
ALTER TABLE "series" DROP COLUMN IF EXISTS "show_tagline";
