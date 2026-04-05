-- Align DB with schema: SeriesPost.postVisibility @map("post_visibility")
ALTER TABLE "series_posts" ADD COLUMN IF NOT EXISTS "post_visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
