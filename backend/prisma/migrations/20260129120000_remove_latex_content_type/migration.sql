-- Update any posts/drafts that used LATEX to MARKDOWN.
UPDATE "posts" SET "content_type" = 'MARKDOWN' WHERE "content_type" = 'LATEX';
UPDATE "drafts" SET "content_type" = 'MARKDOWN' WHERE "content_type" = 'LATEX';

-- Replace enum by creating a new type and swapping (works on all PostgreSQL versions).
CREATE TYPE "ContentType_new" AS ENUM ('MARKDOWN', 'HTML', 'WYSIWYG');

ALTER TABLE "posts" ALTER COLUMN "content_type" TYPE "ContentType_new" USING ("content_type"::text::"ContentType_new");
ALTER TABLE "drafts" ALTER COLUMN "content_type" TYPE "ContentType_new" USING ("content_type"::text::"ContentType_new");

DROP TYPE "ContentType";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";
