-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';
