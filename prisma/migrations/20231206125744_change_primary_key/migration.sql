/*
  Warnings:

  - The primary key for the `wallet_activity` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "wallet_activity" DROP CONSTRAINT "wallet_activity_pkey",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "wallet_activity_pkey" PRIMARY KEY ("id");
