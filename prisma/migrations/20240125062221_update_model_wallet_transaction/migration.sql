-- CreateTable
CREATE TABLE "wallet_transactions" (
    "chatid" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "wallet_number" "wallet_number" NOT NULL,
    "activity" "activities" NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("chatid")
);
