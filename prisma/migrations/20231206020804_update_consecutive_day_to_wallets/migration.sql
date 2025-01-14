/*
  Warnings:

  - You are about to drop the column `current_consecutive_day` on the `wallet_activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallet_activity" DROP COLUMN "current_consecutive_day";

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "consecutive_day" INTEGER NOT NULL DEFAULT 0;
