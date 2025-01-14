/*
  Warnings:

  - You are about to drop the column `copy_amount` on the `copy_target` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `copy_target` table. All the data in the column will be lost.
  - Added the required column `chatid` to the `copy_target` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "copy_target" DROP CONSTRAINT "copy_target_user_chain_fkey";

-- AlterTable
ALTER TABLE "copy_target" DROP COLUMN "copy_amount",
DROP COLUMN "user",
ADD COLUMN     "chatid" TEXT NOT NULL,
ADD COLUMN     "last_copy_amount" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "copy_target" ADD CONSTRAINT "copy_target_chatid_chain_fkey" FOREIGN KEY ("chatid", "chain") REFERENCES "copycat"("chatid", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
