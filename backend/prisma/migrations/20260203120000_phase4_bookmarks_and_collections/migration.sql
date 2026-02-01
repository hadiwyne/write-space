-- CreateTable: bookmarks
CREATE TABLE IF NOT EXISTS "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bookmarks_user_id_post_id_key" ON "bookmarks"("user_id", "post_id");
CREATE INDEX IF NOT EXISTS "bookmarks_user_id_idx" ON "bookmarks"("user_id");
CREATE INDEX IF NOT EXISTS "bookmarks_post_id_idx" ON "bookmarks"("post_id");

ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: collections
CREATE TABLE IF NOT EXISTS "collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_key" ON "collections"("slug");
CREATE INDEX IF NOT EXISTS "collections_user_id_idx" ON "collections"("user_id");

ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: collection_posts
CREATE TABLE IF NOT EXISTS "collection_posts" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "collection_posts_collection_id_post_id_key" ON "collection_posts"("collection_id", "post_id");
CREATE INDEX IF NOT EXISTS "collection_posts_collection_id_idx" ON "collection_posts"("collection_id");
CREATE INDEX IF NOT EXISTS "collection_posts_post_id_idx" ON "collection_posts"("post_id");

ALTER TABLE "collection_posts" ADD CONSTRAINT "collection_posts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_posts" ADD CONSTRAINT "collection_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
