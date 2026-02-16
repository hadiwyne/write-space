-- AlterTable
ALTER TABLE "polls" ADD COLUMN "allow_multiple" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "polls" ADD COLUMN "allow_change_vote" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "poll_votes_user_id_poll_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_user_id_poll_id_poll_option_id_key" ON "poll_votes"("user_id", "poll_id", "poll_option_id");
