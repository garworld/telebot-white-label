/*
  Warnings:

  - You are about to drop the column `tx` on the `wallet_activity` table. All the data in the column will be lost.
  - You are about to drop the column `referralKey` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the `coingeckoTokens` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `activity` to the `wallet_activity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "activities" AS ENUM ('BUYTOKEN', 'CATEGORYBUY', 'COPYTRADESETTING', 'SELLTOKEN');

-- AlterTable
ALTER TABLE "wallet_activity" DROP COLUMN "tx",
ADD COLUMN     "activity" "activities" NOT NULL,
ADD COLUMN     "activity_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "referralKey",
ADD COLUMN     "referral_key" TEXT;

-- DropTable
DROP TABLE "coingeckoTokens";

-- CreateTable
CREATE TABLE "reference" (
    "id" BIGSERIAL NOT NULL,
    "referrer" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_point" (
    "id" BIGSERIAL NOT NULL,
    "activity" "activities" NOT NULL,
    "point" INTEGER NOT NULL,
    "starting_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiplier" (
    "id" SERIAL NOT NULL,
    "chain" INTEGER NOT NULL,
    "consecutive_day" INTEGER NOT NULL,
    "used_wallet" INTEGER NOT NULL,
    "multiplication" DOUBLE PRECISION NOT NULL,
    "starting_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_tiers" (
    "id" SERIAL NOT NULL,
    "tier_name" TEXT NOT NULL,
    "point_min" INTEGER NOT NULL,
    "point_max" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "starting_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coingecko_tokens" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coingecko_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_tiers_tier_name_key" ON "point_tiers"("tier_name");
