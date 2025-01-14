-- AlterTable
ALTER TABLE "copycat" ADD COLUMN     "wallet_used" "wallet_number"[] DEFAULT ARRAY['FIRST']::"wallet_number"[],
ALTER COLUMN "copy_buy" SET DEFAULT true,
ALTER COLUMN "copy_sell" SET DEFAULT false,
ALTER COLUMN "profit_sell" SET DEFAULT true;
