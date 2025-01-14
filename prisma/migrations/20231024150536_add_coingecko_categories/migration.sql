-- CreateTable
CREATE TABLE "coingecko_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market_cap" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coingecko_categories_pkey" PRIMARY KEY ("id")
);
