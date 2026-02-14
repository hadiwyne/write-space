-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "anonymous_alias" TEXT,
ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
