/*
  Warnings:

  - Added the required column `issuer` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "issuer" TEXT;
UPDATE "Account" SET "issuer" = 'local:' || "providerId" WHERE "issuer" IS NULL;
ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;
