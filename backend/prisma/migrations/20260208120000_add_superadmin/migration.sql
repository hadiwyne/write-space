-- Superadmin: invisible to other users, can see all posts and delete any post/comment
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_superadmin" BOOLEAN NOT NULL DEFAULT false;
