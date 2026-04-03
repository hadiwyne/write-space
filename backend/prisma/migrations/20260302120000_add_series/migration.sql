-- CreateEnum
CREATE TYPE "SeriesVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SeriesRole" AS ENUM ('OWNER', 'EDITOR', 'CONTRIBUTOR');

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "logo_data" BYTEA,
    "logo_mime_type" TEXT,
    "wordmark_data" BYTEA,
    "wordmark_mime_type" TEXT,
    "cover_data" BYTEA,
    "cover_mime_type" TEXT,
    "social_preview_data" BYTEA,
    "social_preview_mime_type" TEXT,
    "cover_bg_color" TEXT,
    "accent_color" TEXT,
    "bg_color" TEXT,
    "font_family" TEXT,
    "layout_mode" TEXT NOT NULL DEFAULT 'feature',
    "post_list_mode" TEXT NOT NULL DEFAULT 'list',
    "show_top_posts" BOOLEAN NOT NULL DEFAULT true,
    "nav_links" JSONB,
    "pinned_post_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "show_tagline" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "SeriesVisibility" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_members" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "SeriesRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_posts" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_owner_id_idx" ON "series"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_members_series_id_user_id_key" ON "series_members"("series_id", "user_id");

-- CreateIndex
CREATE INDEX "series_members_series_id_idx" ON "series_members"("series_id");

-- CreateIndex
CREATE INDEX "series_members_user_id_idx" ON "series_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_posts_series_id_post_id_key" ON "series_posts"("series_id", "post_id");

-- CreateIndex
CREATE INDEX "series_posts_series_id_idx" ON "series_posts"("series_id");

-- CreateIndex
CREATE INDEX "series_posts_post_id_idx" ON "series_posts"("post_id");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_members" ADD CONSTRAINT "series_members_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_members" ADD CONSTRAINT "series_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_posts" ADD CONSTRAINT "series_posts_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_posts" ADD CONSTRAINT "series_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
