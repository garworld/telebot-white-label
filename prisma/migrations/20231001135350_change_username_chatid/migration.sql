/*
  Warnings:

  - You are about to drop the column `username` on the `snipe` table. All the data in the column will be lost.
  - The primary key for the `wallet_activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `username` on the `wallet_activity` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `wallets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chatid]` on the table `snipe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatid]` on the table `wallet_activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatid]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatid` to the `snipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatid` to the `wallet_activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatid` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "snipe_target" DROP CONSTRAINT "snipe_target_user_fkey";

-- DropIndex
DROP INDEX "snipe_username_key";

-- DropIndex
DROP INDEX "wallet_activity_username_key";

-- DropIndex
DROP INDEX "wallets_username_key";

-- AlterTable
ALTER TABLE "snipe" DROP COLUMN "username",
ADD COLUMN     "chatid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "wallet_activity" DROP CONSTRAINT "wallet_activity_pkey",
DROP COLUMN "username",
ADD COLUMN     "chatid" TEXT NOT NULL,
ADD CONSTRAINT "wallet_activity_pkey" PRIMARY KEY ("chatid", "wallet_number");

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "username",
ADD COLUMN     "chatid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "chain_list" (
    "id" SERIAL NOT NULL,
    "chain_name" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chain_list_chain_name_key" ON "chain_list"("chain_name");

-- CreateIndex
CREATE UNIQUE INDEX "chain_list_chain_id_key" ON "chain_list"("chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "snipe_chatid_key" ON "snipe"("chatid");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_activity_chatid_key" ON "wallet_activity"("chatid");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_chatid_key" ON "wallets"("chatid");

-- AddForeignKey
ALTER TABLE "snipe_target" ADD CONSTRAINT "snipe_target_user_fkey" FOREIGN KEY ("user") REFERENCES "snipe"("chatid") ON DELETE RESTRICT ON UPDATE CASCADE;
