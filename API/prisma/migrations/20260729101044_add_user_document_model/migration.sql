/*
  Warnings:

  - You are about to drop the column `idCardExpiryDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `idCardNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passportExpiryDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passportNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `socialSecurityNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `taxIdNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workPermit` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workPermitExpiryDate` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'ID_CARD', 'TAX_ID', 'SOCIAL_SECURITY', 'WORK_PERMIT', 'VISA', 'DRIVERS_LICENSE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogAction" ADD VALUE 'DOCUMENT_ADD';
ALTER TYPE "LogAction" ADD VALUE 'DOCUMENT_DELETE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "idCardExpiryDate",
DROP COLUMN "idCardNumber",
DROP COLUMN "passportExpiryDate",
DROP COLUMN "passportNumber",
DROP COLUMN "socialSecurityNumber",
DROP COLUMN "taxIdNumber",
DROP COLUMN "workPermit",
DROP COLUMN "workPermitExpiryDate";

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "documentNumber" TEXT,
    "issuingCountry" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "description" TEXT,
    "filePath" TEXT,
    "filePathBack" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDocument_userId_idx" ON "UserDocument"("userId");

-- CreateIndex
CREATE INDEX "UserDocument_expiryDate_idx" ON "UserDocument"("expiryDate");

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
