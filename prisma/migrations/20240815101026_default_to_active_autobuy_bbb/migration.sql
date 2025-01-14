/*
  Warnings:

  - You are about to drop the column `is_default` on the `autobuy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "autobuy" DROP COLUMN "is_default",
ADD COLUMN     "is_active" BOOLEAN DEFAULT false;
