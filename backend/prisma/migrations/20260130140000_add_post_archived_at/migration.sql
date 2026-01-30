-- AlterTable
ALTER TABLE "posts" ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "posts_archived_at_idx" ON "posts"("archived_at");
