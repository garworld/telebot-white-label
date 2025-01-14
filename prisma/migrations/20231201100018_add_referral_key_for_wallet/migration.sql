/*
  Warnings:

  - Added the required column `referralKey` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "referralKey" TEXT;
