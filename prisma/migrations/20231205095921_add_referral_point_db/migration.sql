-- CreateTable
CREATE TABLE "referral_point" (
    "id" BIGSERIAL NOT NULL,
    "chatid" TEXT NOT NULL,
    "activity_point" INTEGER NOT NULL,
    "reference" TEXT,
    "points_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_point_pkey" PRIMARY KEY ("id")
);
