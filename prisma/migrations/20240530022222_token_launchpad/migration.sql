-- CreateTable
CREATE TABLE "launchpad" (
    "contract" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "chain" INTEGER NOT NULL,
    "token_image" TEXT,
    "token_description" TEXT,
    "token_background" TEXT,
    "token_weblink" TEXT,
    "token_telegram" TEXT,
    "token_twitter" TEXT,
    "token_github" TEXT,
    "token_instagram" TEXT,
    "token_youtube" TEXT,
    "owner" TEXT NOT NULL,
    "presalerate" INTEGER NOT NULL,
    "softcap" INTEGER NOT NULL,
    "hardcap" INTEGER NOT NULL,
    "minbuy" INTEGER NOT NULL,
    "maxbuy" INTEGER NOT NULL,
    "starttime" INTEGER NOT NULL,
    "endtime" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "launchpad_pkey" PRIMARY KEY ("contract")
);
