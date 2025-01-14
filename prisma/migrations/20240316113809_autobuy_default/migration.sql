-- CreateTable
CREATE TABLE "autobuy" (
    "chatid" TEXT NOT NULL,
    "wallet_used" "wallet_number"[] DEFAULT ARRAY['FIRST']::"wallet_number"[],
    "chain" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "unit" TEXT,
    "slippage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "is_private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "autobuy_pkey" PRIMARY KEY ("chatid")
);
