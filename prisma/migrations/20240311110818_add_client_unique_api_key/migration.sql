-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "api_key" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_link" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_api_key_key" ON "client"("api_key");
