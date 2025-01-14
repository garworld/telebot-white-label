/*
  Warnings:

  - Added the required column `price_change_24h` to the `token_price` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "token_price" ADD COLUMN     "market_change_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price_change_14d_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price_change_1y_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price_change_200d_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price_change_24h" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "price_change_30d_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price_change_7d_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;
