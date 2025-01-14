/*
  Warnings:

  - You are about to drop the column `price_native` on the `dexscreener_token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dexscreener_token" DROP COLUMN "price_native",
ALTER COLUMN "fdv" SET DATA TYPE DOUBLE PRECISION;
