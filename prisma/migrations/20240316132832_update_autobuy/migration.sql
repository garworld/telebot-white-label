/*
  Warnings:

  - You are about to drop the column `chain` on the `autobuy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "autobuy" DROP COLUMN "chain",
ALTER COLUMN "amount" SET DEFAULT 1000;
