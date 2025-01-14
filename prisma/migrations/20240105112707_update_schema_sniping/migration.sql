/*
  Warnings:

  - You are about to drop the column `auto_sell` on the `sniping_mode` table. All the data in the column will be lost.
  - You are about to alter the column `min_liquidity` on the `sniping_mode` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `max_liquidity` on the `sniping_mode` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `target_snipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `target_snipe` table. All the data in the column will be lost.
  - Added the required column `chain` to the `target_snipe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sniping_mode" DROP COLUMN "auto_sell",
ADD COLUMN     "anti_rug_gwei" DECIMAL(65,30) NOT NULL DEFAULT 30,
ALTER COLUMN "degen_mode" SET DEFAULT true,
ALTER COLUMN "min_liquidity" SET DATA TYPE INTEGER,
ALTER COLUMN "max_liquidity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "target_snipe" DROP CONSTRAINT "target_snipe_pkey",
DROP COLUMN "id",
ADD COLUMN     "chain" INTEGER NOT NULL,
ADD CONSTRAINT "target_snipe_pkey" PRIMARY KEY ("chatid", "chain");
