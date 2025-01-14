/*
  Warnings:

  - You are about to drop the `snipe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `snipe_target` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "copy_type" AS ENUM ('PERCENT', 'EXACT');

-- DropForeignKey
ALTER TABLE "snipe_target" DROP CONSTRAINT "snipe_target_user_fkey";

-- DropTable
DROP TABLE "snipe";

-- DropTable
DROP TABLE "snipe_target";

-- CreateTable
CREATE TABLE "copycat" (
    "id" BIGSERIAL NOT NULL,
    "chatid" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "copy_type" "copy_type" NOT NULL,
    "copy_buy" BOOLEAN NOT NULL,
    "copy_sell" BOOLEAN NOT NULL,
    "limit_amount" DOUBLE PRECISION NOT NULL,
    "profit_sell" BOOLEAN NOT NULL,

    CONSTRAINT "copycat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_target" (
    "id" BIGSERIAL NOT NULL,
    "target_address" TEXT NOT NULL,
    "copy_amount" DOUBLE PRECISION,
    "user" TEXT NOT NULL,
    "last_copying_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copy_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "copycat_chatid_key" ON "copycat"("chatid");

-- AddForeignKey
ALTER TABLE "copy_target" ADD CONSTRAINT "copy_target_user_fkey" FOREIGN KEY ("user") REFERENCES "copycat"("chatid") ON DELETE RESTRICT ON UPDATE CASCADE;
