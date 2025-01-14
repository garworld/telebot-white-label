/*
  Warnings:

  - The primary key for the `sniping_mode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `sniping_mode` table. All the data in the column will be lost.
  - Added the required column `chain` to the `sniping_mode` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "sniping_mode_chatid_key";

-- AlterTable
ALTER TABLE "sniping_mode" DROP CONSTRAINT "sniping_mode_pkey",
DROP COLUMN "id",
ADD COLUMN     "chain" INTEGER NOT NULL,
ADD CONSTRAINT "sniping_mode_pkey" PRIMARY KEY ("chatid", "chain");
