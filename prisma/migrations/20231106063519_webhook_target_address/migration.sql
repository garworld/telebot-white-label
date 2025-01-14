/*
  Warnings:

  - Added the required column `webhook_id` to the `copy_target` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "copy_target" ADD COLUMN     "webhook_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "copy_target" ADD CONSTRAINT "copy_target_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
