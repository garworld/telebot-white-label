-- CreateTable
CREATE TABLE "hodling" (
    "chatid" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "wallet_number" "wallet_number" NOT NULL,
    "token" TEXT NOT NULL,
    "amount_makers_usd" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hodling_pkey" PRIMARY KEY ("chatid","chain","wallet_number","token")
);
