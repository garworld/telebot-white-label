-- CreateTable
CREATE TABLE "wallets" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "first_wallet_pk" TEXT NOT NULL,
    "first_wallet_mnemonic" TEXT[],
    "second_wallet_pk" TEXT NOT NULL,
    "second_wallet_mnemonic" TEXT[],
    "third_wallet_pk" TEXT NOT NULL,
    "third_wallet_mnemonic" TEXT[]
);

-- CreateTable
CREATE TABLE "seeds" (
    "id" BIGSERIAL NOT NULL,
    "private_key" TEXT NOT NULL,
    "mnemonic_phrase" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_username_key" ON "wallets"("username");

-- CreateIndex
CREATE UNIQUE INDEX "seeds_private_key_key" ON "seeds"("private_key");

-- CreateIndex
CREATE UNIQUE INDEX "seeds_mnemonic_phrase_key" ON "seeds"("mnemonic_phrase");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_first_wallet_pk_fkey" FOREIGN KEY ("first_wallet_pk") REFERENCES "seeds"("private_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_first_wallet_mnemonic_fkey" FOREIGN KEY ("first_wallet_mnemonic") REFERENCES "seeds"("mnemonic_phrase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_second_wallet_pk_fkey" FOREIGN KEY ("second_wallet_pk") REFERENCES "seeds"("private_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_second_wallet_mnemonic_fkey" FOREIGN KEY ("second_wallet_mnemonic") REFERENCES "seeds"("mnemonic_phrase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_third_wallet_pk_fkey" FOREIGN KEY ("third_wallet_pk") REFERENCES "seeds"("private_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_third_wallet_mnemonic_fkey" FOREIGN KEY ("third_wallet_mnemonic") REFERENCES "seeds"("mnemonic_phrase") ON DELETE RESTRICT ON UPDATE CASCADE;
