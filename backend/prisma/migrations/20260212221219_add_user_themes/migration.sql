-- CreateTable
CREATE TABLE "user_themes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "palette" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_themes_user_id_idx" ON "user_themes"("user_id");

-- AddForeignKey
ALTER TABLE "user_themes" ADD CONSTRAINT "user_themes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
