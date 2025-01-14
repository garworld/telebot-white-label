/*
  Warnings:

  - You are about to alter the column `activity_points` on the `wallets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "activity_points" SET DATA TYPE DOUBLE PRECISION;
