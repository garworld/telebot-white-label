/*
  Warnings:

  - The primary key for the `wallet_transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");
