-- AlterTable
ALTER TABLE "dexscreener_token" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lp_token" DROP NOT NULL,
ALTER COLUMN "lp_current" DROP NOT NULL;