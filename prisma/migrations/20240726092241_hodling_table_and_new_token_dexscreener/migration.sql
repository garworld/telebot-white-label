/*
  Warnings:

  - Added the required column `amount_token` to the `hodling` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "hodling" ADD COLUMN     "amount_token" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "dexscreener_token" (
    "token" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "price_native" DOUBLE PRECISION NOT NULL,
    "price_usd" DOUBLE PRECISION NOT NULL,
    "liquidity_usd" DOUBLE PRECISION NOT NULL,
    "fdv" BIGINT NOT NULL,
    "lp_token" BIGINT NOT NULL,
    "lp_current" BIGINT NOT NULL,

    CONSTRAINT "dexscreener_token_pkey" PRIMARY KEY ("token","chain")
);
