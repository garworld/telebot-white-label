-- CreateTable
CREATE TABLE "api_key" (
    "id" BIGSERIAL NOT NULL,
    "chatid" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "api_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_chatid_key" ON "api_key"("chatid");
