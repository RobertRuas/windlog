/*
  Warnings:

  - You are about to drop the column `fileName` on the `UserDocument` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `UserDocument` table. All the data in the column will be lost.
  - You are about to drop the column `filePathBack` on the `UserDocument` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `UserDocument` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'POSTING_ORDER';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_EXAM';

-- AlterTable
ALTER TABLE "UserDocument" DROP COLUMN "fileName",
DROP COLUMN "filePath",
DROP COLUMN "filePathBack",
DROP COLUMN "fileType";

-- CreateTable
CREATE TABLE "UserDocumentFile" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bicSwift" TEXT,
    "accountHolder" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDocumentFile_documentId_idx" ON "UserDocumentFile"("documentId");

-- CreateIndex
CREATE INDEX "UserDocumentFile_uploadedFileId_idx" ON "UserDocumentFile"("uploadedFileId");

-- CreateIndex
CREATE INDEX "UploadedFile_userId_idx" ON "UploadedFile"("userId");

-- CreateIndex
CREATE INDEX "UploadedFile_category_idx" ON "UploadedFile"("category");

-- CreateIndex
CREATE INDEX "UserBankAccount_userId_idx" ON "UserBankAccount"("userId");

-- AddForeignKey
ALTER TABLE "UserDocumentFile" ADD CONSTRAINT "UserDocumentFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "UserDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentFile" ADD CONSTRAINT "UserDocumentFile_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBankAccount" ADD CONSTRAINT "UserBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
