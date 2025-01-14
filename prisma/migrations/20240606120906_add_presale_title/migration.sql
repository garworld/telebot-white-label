/*
  Warnings:

  - Added the required column `presale_title` to the `launchpad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "launchpad" ADD COLUMN     "presale_title" TEXT NOT NULL;
