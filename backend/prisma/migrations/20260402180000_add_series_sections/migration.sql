-- CreateTable
CREATE TABLE "series_sections" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "layout_mode" TEXT NOT NULL DEFAULT 'list',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_section_posts" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_section_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_sections_series_id_slug_key" ON "series_sections"("series_id", "slug");
CREATE INDEX "series_sections_series_id_idx" ON "series_sections"("series_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_section_posts_section_id_post_id_key" ON "series_section_posts"("section_id", "post_id");
CREATE INDEX "series_section_posts_section_id_idx" ON "series_section_posts"("section_id");
CREATE INDEX "series_section_posts_post_id_idx" ON "series_section_posts"("post_id");

-- AddForeignKey
ALTER TABLE "series_sections" ADD CONSTRAINT "series_sections_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_section_posts" ADD CONSTRAINT "series_section_posts_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "series_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_section_posts" ADD CONSTRAINT "series_section_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
