-- CreateEnum
CREATE TYPE "wallet_number" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- CreateTable
CREATE TABLE "wallet_activity" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "wallet_number" "wallet_number" NOT NULL,
    "tx" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_activity_username_key" ON "wallet_activity"("username");
