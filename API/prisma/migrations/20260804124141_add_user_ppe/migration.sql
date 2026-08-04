-- CreateEnum
CREATE TYPE "PpeCategory" AS ENUM ('COMPANY_PROVIDED', 'PERSONAL');

-- CreateEnum
CREATE TYPE "PpeType" AS ENUM ('HARNESS', 'HELMET', 'ROPE', 'FALL_ARREST', 'GLOVES', 'FOOTWEAR', 'EYE_PROTECTION', 'RESPIRATORY', 'ANCHOR_CONNECTOR', 'FIRST_AID', 'OTHER');

-- CreateEnum
CREATE TYPE "PpeCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'NEEDS_REPLACEMENT', 'EXPIRED', 'RETIRED');

-- CreateTable
CREATE TABLE "UserPpe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PpeCategory" NOT NULL DEFAULT 'COMPANY_PROVIDED',
    "type" "PpeType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "condition" "PpeCondition" NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "filePath" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPpe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPpe_userId_idx" ON "UserPpe"("userId");

-- CreateIndex
CREATE INDEX "UserPpe_nextInspectionDate_idx" ON "UserPpe"("nextInspectionDate");

-- CreateIndex
CREATE INDEX "UserPpe_condition_idx" ON "UserPpe"("condition");

-- AddForeignKey
ALTER TABLE "UserPpe" ADD CONSTRAINT "UserPpe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
