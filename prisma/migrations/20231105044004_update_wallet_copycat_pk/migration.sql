/*
  Warnings:

  - The primary key for the `copycat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `copycat` table. All the data in the column will be lost.
  - Added the required column `chain` to the `copy_target` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "copy_target" DROP CONSTRAINT "copy_target_user_fkey";

-- DropIndex
DROP INDEX "copycat_chatid_key";

-- DropIndex
DROP INDEX "wallet_activity_chatid_key";

-- AlterTable
ALTER TABLE "copy_target" ADD COLUMN     "chain" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "copycat" DROP CONSTRAINT "copycat_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "copycat_pkey" PRIMARY KEY ("chatid", "chain");

-- AddForeignKey
ALTER TABLE "copy_target" ADD CONSTRAINT "copy_target_user_chain_fkey" FOREIGN KEY ("user", "chain") REFERENCES "copycat"("chatid", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
