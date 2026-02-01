-- CreateTable: reposts
CREATE TABLE IF NOT EXISTS "reposts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reposts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reposts_user_id_post_id_key" ON "reposts"("user_id", "post_id");
CREATE INDEX IF NOT EXISTS "reposts_user_id_idx" ON "reposts"("user_id");
CREATE INDEX IF NOT EXISTS "reposts_post_id_idx" ON "reposts"("post_id");

ALTER TABLE "reposts" ADD CONSTRAINT "reposts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
