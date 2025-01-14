/*
  Warnings:

  - A unique constraint covering the columns `[recipient]` on the table `reference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reference_recipient_key" ON "reference"("recipient");
