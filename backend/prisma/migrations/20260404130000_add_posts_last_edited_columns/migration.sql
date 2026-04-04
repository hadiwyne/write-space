-- Align DB with schema: Post.lastEditedById / lastEditedAt
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "last_edited_by_id" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "last_edited_at" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_last_edited_by_id_fkey'
  ) THEN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_last_edited_by_id_fkey"
    FOREIGN KEY ("last_edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
