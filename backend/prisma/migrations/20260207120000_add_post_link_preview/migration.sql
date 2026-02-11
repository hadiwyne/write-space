-- Link preview (og:image, og:title, etc.) for first URL in post content
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "link_preview" JSONB;
