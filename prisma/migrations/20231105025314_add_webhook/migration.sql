-- CreateTable
CREATE TABLE "webhook" (
    "id" TEXT NOT NULL,
    "number_of_address" INTEGER NOT NULL DEFAULT 0,
    "chain" TEXT NOT NULL,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("id")
);
