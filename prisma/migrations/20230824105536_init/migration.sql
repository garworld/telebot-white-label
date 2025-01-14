-- CreateTable
CREATE TABLE "__diesel_schema_migrations" (
    "version" VARCHAR(50) NOT NULL,
    "run_on" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "__diesel_schema_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "burns" (
    "row_id" BIGSERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "pair_address" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMP(6) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "amount_0" DECIMAL NOT NULL,
    "amount_1" DECIMAL NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "amount_eth" DOUBLE PRECISION NOT NULL,
    "amount_0_eth" DOUBLE PRECISION NOT NULL,
    "amount_1_eth" DOUBLE PRECISION NOT NULL,
    "amount_0_usd" DOUBLE PRECISION NOT NULL,
    "amount_1_usd" DOUBLE PRECISION NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "burns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" BIGSERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "mints" (
    "row_id" BIGSERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "pair_address" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMP(6) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "amount_0" DECIMAL NOT NULL,
    "amount_1" DECIMAL NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "amount_eth" DOUBLE PRECISION NOT NULL,
    "amount_0_eth" DOUBLE PRECISION NOT NULL,
    "amount_1_eth" DOUBLE PRECISION NOT NULL,
    "amount_0_usd" DOUBLE PRECISION NOT NULL,
    "amount_1_usd" DOUBLE PRECISION NOT NULL,
    "sender" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairs" (
    "id" BIGSERIAL NOT NULL,
    "factory_address" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "token_0" TEXT NOT NULL,
    "token_1" TEXT NOT NULL,
    "token_lhs" TEXT NOT NULL,
    "token_rhs" TEXT NOT NULL,
    "deploy_transaction" TEXT NOT NULL,
    "deploy_block_number" BIGINT NOT NULL,
    "deploy_block_timestamp" TIMESTAMP(6) NOT NULL,
    "deployer" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairs_pkey" PRIMARY KEY ("contract_address")
);

-- CreateTable
CREATE TABLE "syncs" (
    "row_id" BIGSERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "pair_address" TEXT NOT NULL,
    "reserve_0" DECIMAL NOT NULL,
    "reserve_1" DECIMAL NOT NULL,
    "quote_price" DOUBLE PRECISION NOT NULL,
    "quote_price_usd" DOUBLE PRECISION NOT NULL,
    "quote_price_eth" DOUBLE PRECISION NOT NULL,
    "block_timestamp" TIMESTAMP(6) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" BIGSERIAL NOT NULL,
    "contract_address" TEXT NOT NULL,
    "decimals" BIGINT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("contract_address")
);

-- CreateTable
CREATE TABLE "trades" (
    "row_id" BIGSERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "factory_address" TEXT NOT NULL,
    "pair_address" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMP(6) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "trader" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "amount_in" DECIMAL NOT NULL,
    "amount_out" DECIMAL NOT NULL,
    "side" TEXT NOT NULL,
    "price_currency" DECIMAL NOT NULL,
    "price_usd" DOUBLE PRECISION NOT NULL,
    "price_eth" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "transaction_index" BIGINT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMP(6) NOT NULL,
    "origin" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "eth_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_hash")
);
