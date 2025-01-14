/*
  Warnings:

  - Added the required column `is_autolist` to the `launchpad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_whitelist` to the `launchpad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "launchpad" ADD COLUMN     "is_autolist" BOOLEAN NOT NULL,
ADD COLUMN     "is_whitelist" BOOLEAN NOT NULL;
