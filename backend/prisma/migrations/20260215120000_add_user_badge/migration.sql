-- AlterTable
ALTER TABLE "users" ADD COLUMN "badge_url" TEXT;
ALTER TABLE "users" ADD COLUMN "badge_data" BYTEA;
ALTER TABLE "users" ADD COLUMN "badge_mime_type" TEXT;
