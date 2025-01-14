/*
  Warnings:

  - You are about to drop the column `id` on the `wallet_activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallet_activity" DROP COLUMN "id",
ADD CONSTRAINT "wallet_activity_pkey" PRIMARY KEY ("username", "wallet_number");
