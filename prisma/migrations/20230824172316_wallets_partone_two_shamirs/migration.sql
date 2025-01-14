/*
  Warnings:

  - You are about to drop the column `first_wallet_mnemonic` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `first_wallet_pk` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `second_wallet_mnemonic` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `second_wallet_pk` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `third_wallet_mnemonic` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `third_wallet_pk` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the `seeds` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `partone_first` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partone_second` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partone_third` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parttwo_first` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parttwo_second` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parttwo_third` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_first_wallet_mnemonic_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_first_wallet_pk_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_second_wallet_mnemonic_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_second_wallet_pk_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_third_wallet_mnemonic_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_third_wallet_pk_fkey";

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "first_wallet_mnemonic",
DROP COLUMN "first_wallet_pk",
DROP COLUMN "second_wallet_mnemonic",
DROP COLUMN "second_wallet_pk",
DROP COLUMN "third_wallet_mnemonic",
DROP COLUMN "third_wallet_pk",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "partone_first" TEXT NOT NULL,
ADD COLUMN     "partone_second" TEXT NOT NULL,
ADD COLUMN     "partone_third" TEXT NOT NULL,
ADD COLUMN     "parttwo_first" TEXT NOT NULL,
ADD COLUMN     "parttwo_second" TEXT NOT NULL,
ADD COLUMN     "parttwo_third" TEXT NOT NULL;

-- DropTable
DROP TABLE "seeds";
