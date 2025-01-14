-- CreateTable
CREATE TABLE "sniping_mode" (
    "id" BIGSERIAL NOT NULL,
    "chatid" TEXT NOT NULL,
    "max_spend" DOUBLE PRECISION NOT NULL,
    "wallet_used" "wallet_number"[],
    "auto_sell" BOOLEAN NOT NULL DEFAULT false,
    "first_or_fail" BOOLEAN NOT NULL DEFAULT true,
    "degen_mode" BOOLEAN NOT NULL DEFAULT false,
    "anti_rug" BOOLEAN NOT NULL DEFAULT false,
    "max_tx" BOOLEAN NOT NULL DEFAULT false,
    "min_tx" BOOLEAN NOT NULL DEFAULT false,
    "pre_approve" BOOLEAN NOT NULL DEFAULT false,
    "tx_on_blacklist" BOOLEAN NOT NULL DEFAULT false,
    "approve_gwei" DECIMAL(65,30) NOT NULL DEFAULT 30,
    "sell_gwei" DECIMAL(65,30) NOT NULL DEFAULT 30,
    "buy_tax" INTEGER NOT NULL DEFAULT 10,
    "sell_tax" INTEGER NOT NULL DEFAULT 10,
    "min_liquidity" BIGINT NOT NULL,
    "max_liquidity" BIGINT NOT NULL,

    CONSTRAINT "sniping_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_snipe" (
    "id" BIGSERIAL NOT NULL,
    "chatid" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "tip" DECIMAL(65,30) NOT NULL,
    "slippage" INTEGER NOT NULL,

    CONSTRAINT "target_snipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sniping_mode_chatid_key" ON "sniping_mode"("chatid");
