/*
  Warnings:

  - A unique constraint covering the columns `[rpc_provider]` on the table `chain_list` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chain_scanner]` on the table `chain_list` will be added. If there are existing duplicate values, this will fail.
  - Made the column `chain_scanner` on table `chain_list` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rpc_provider` on table `chain_list` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "chain_list" ALTER COLUMN "chain_scanner" SET NOT NULL,
ALTER COLUMN "rpc_provider" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "chain_list_rpc_provider_key" ON "chain_list"("rpc_provider");

-- CreateIndex
CREATE UNIQUE INDEX "chain_list_chain_scanner_key" ON "chain_list"("chain_scanner");
