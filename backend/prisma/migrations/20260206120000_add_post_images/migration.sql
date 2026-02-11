-- Post images stored in DB (persist on ephemeral hosts; no external storage)
CREATE TABLE IF NOT EXISTS "post_images" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "post_images_user_id_idx" ON "post_images"("user_id");

ALTER TABLE "post_images" ADD CONSTRAINT "post_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
