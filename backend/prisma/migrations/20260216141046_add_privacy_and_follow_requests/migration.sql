-- AlterTable
ALTER TABLE "users" ADD COLUMN     "who_can_follow_me" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "who_can_see_followers" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "who_can_see_following" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "who_can_see_likes" TEXT NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "follow_requests" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follow_requests_to_user_id_idx" ON "follow_requests"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_requests_from_user_id_to_user_id_key" ON "follow_requests"("from_user_id", "to_user_id");

-- AddForeignKey
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
