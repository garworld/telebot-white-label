-- AlterTable
ALTER TABLE "coingecko_tokens" ADD COLUMN     "image_url" TEXT;

-- CreateTable
CREATE TABLE "coingecko_chains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chain_number" BIGINT,

    CONSTRAINT "coingecko_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_chain" (
    "token_address" TEXT NOT NULL,
    "token_decimal" INTEGER,
    "token_id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,

    CONSTRAINT "token_chain_pkey" PRIMARY KEY ("token_address","chain_id")
);

-- CreateTable
CREATE TABLE "token_categories" (
    "token_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "token_categories_pkey" PRIMARY KEY ("token_id","category_id")
);

-- AddForeignKey
ALTER TABLE "token_chain" ADD CONSTRAINT "token_chain_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "coingecko_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_chain" ADD CONSTRAINT "token_chain_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "coingecko_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_categories" ADD CONSTRAINT "token_categories_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "coingecko_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_categories" ADD CONSTRAINT "token_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "coingecko_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
