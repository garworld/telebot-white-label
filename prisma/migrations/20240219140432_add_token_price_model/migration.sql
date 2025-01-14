-- CreateTable
CREATE TABLE "token_price" (
    "token_id" TEXT NOT NULL,
    "usd_price" DOUBLE PRECISION NOT NULL,
    "price_change_24h_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "market_change_24h_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "token_price_pkey" PRIMARY KEY ("token_id")
);

-- AddForeignKey
ALTER TABLE "token_price" ADD CONSTRAINT "token_price_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "coingecko_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
