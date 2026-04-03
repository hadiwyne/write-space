-- AlterTable: add status to series_posts
ALTER TABLE "series_posts" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- CreateTable: series_follows
CREATE TABLE "series_follows" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable: series_invite_tokens
CREATE TABLE "series_invite_tokens" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_follows_series_id_user_id_key" ON "series_follows"("series_id", "user_id");

-- CreateIndex
CREATE INDEX "series_follows_series_id_idx" ON "series_follows"("series_id");

-- CreateIndex
CREATE INDEX "series_follows_user_id_idx" ON "series_follows"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_invite_tokens_token_key" ON "series_invite_tokens"("token");

-- CreateIndex
CREATE INDEX "series_invite_tokens_series_id_idx" ON "series_invite_tokens"("series_id");

-- AddForeignKey
ALTER TABLE "series_follows" ADD CONSTRAINT "series_follows_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_follows" ADD CONSTRAINT "series_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_invite_tokens" ADD CONSTRAINT "series_invite_tokens_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_invite_tokens" ADD CONSTRAINT "series_invite_tokens_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
