/*
  Warnings:

  - A unique constraint covering the columns `[client_link]` on the table `client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "client_client_link_key" ON "client"("client_link");
