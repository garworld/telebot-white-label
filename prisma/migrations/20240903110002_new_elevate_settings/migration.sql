-- CreateTable
CREATE TABLE "elevate_settings" (
    "chatid" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "wallet_used" TEXT,
    "mev_protect" BOOLEAN NOT NULL DEFAULT false,
    "hide_low_liquidity" BOOLEAN NOT NULL DEFAULT true,
    "slippage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "autobuy_amount" DOUBLE PRECISION,
    "autobuy_active" BOOLEAN NOT NULL DEFAULT false,
    "autosell_up_amount" DOUBLE PRECISION,
    "autosell_down_amount" DOUBLE PRECISION,
    "autosell_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "elevate_settings_pkey" PRIMARY KEY ("chatid","chain")
);
