/*
  Warnings:

  - The primary key for the `target_snipe` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "target_snipe" DROP CONSTRAINT "target_snipe_pkey",
ADD CONSTRAINT "target_snipe_pkey" PRIMARY KEY ("chatid", "chain", "address");
