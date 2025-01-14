/*
  Warnings:

  - The values [COPYTRADESETTING,DEPOSIT,FIRSTCOPYTRADESETTING] on the enum `activities` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "activities_new" AS ENUM ('BUYTOKEN', 'CATEGORYBUY', 'COPYTRADE', 'REFERRAL', 'SELLTOKEN', 'FIRSTBUYTOKEN', 'FIRSTCATEGORYBUY', 'FIRSTCOPYTRADE', 'FIRSTDEPOSIT', 'FIRSTSELLTOKEN');
ALTER TABLE "wallet_activity" ALTER COLUMN "activity" TYPE "activities_new" USING ("activity"::text::"activities_new");
ALTER TABLE "activity_point" ALTER COLUMN "activity" TYPE "activities_new" USING ("activity"::text::"activities_new");
ALTER TYPE "activities" RENAME TO "activities_old";
ALTER TYPE "activities_new" RENAME TO "activities";
DROP TYPE "activities_old";
COMMIT;
