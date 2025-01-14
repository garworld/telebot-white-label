-- CreateTable
CREATE TABLE "snipe" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "snipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snipe_target" (
    "id" BIGSERIAL NOT NULL,
    "target_address" TEXT NOT NULL,
    "limit_amount" DOUBLE PRECISION NOT NULL,
    "user" TEXT NOT NULL,
    "sniping_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snipe_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snipe_username_key" ON "snipe"("username");

-- AddForeignKey
ALTER TABLE "snipe_target" ADD CONSTRAINT "snipe_target_user_fkey" FOREIGN KEY ("user") REFERENCES "snipe"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
