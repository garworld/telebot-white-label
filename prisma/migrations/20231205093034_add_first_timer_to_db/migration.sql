-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "activities" ADD VALUE 'DEPOSIT';
ALTER TYPE "activities" ADD VALUE 'REFERRAL';

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "first_buy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "first_category" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "first_copy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "first_deposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "first_sell" BOOLEAN NOT NULL DEFAULT false;
