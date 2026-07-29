-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_DEACTIVATE', 'USER_REACTIVATE', 'USER_ROLE_CHANGE', 'PROFILE_UPDATE', 'PROFILE_VIEW', 'PHONE_ADD', 'PHONE_UPDATE', 'PHONE_DELETE', 'CERTIFICATION_ADD', 'CERTIFICATION_UPDATE', 'CERTIFICATION_DELETE', 'LANGUAGE_ADD', 'LANGUAGE_UPDATE', 'LANGUAGE_DELETE', 'DOCUMENT_UPDATE', 'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_DELETE', 'TURBINE_CREATE', 'TURBINE_UPDATE', 'TURBINE_DELETE', 'TECHNICIAN_CREATE', 'TECHNICIAN_UPDATE', 'TECHNICIAN_DELETE', 'SYSTEM_ERROR', 'API_ERROR', 'ACCESS_DENIED', 'DATA_EXPORT', 'DATA_IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idCardExpiryDate" TIMESTAMP(3),
ADD COLUMN     "idCardNumber" TEXT,
ADD COLUMN     "passportExpiryDate" TIMESTAMP(3),
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "socialSecurityNumber" TEXT,
ADD COLUMN     "taxIdNumber" TEXT,
ADD COLUMN     "workPermit" TEXT,
ADD COLUMN     "workPermitExpiryDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "severity" "LogSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "entity" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "url" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");

-- CreateIndex
CREATE INDEX "SystemLog_action_idx" ON "SystemLog"("action");

-- CreateIndex
CREATE INDEX "SystemLog_severity_idx" ON "SystemLog"("severity");

-- CreateIndex
CREATE INDEX "SystemLog_entity_entityId_idx" ON "SystemLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_action_idx" ON "SystemLog"("createdAt", "action");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_userId_idx" ON "SystemLog"("createdAt", "userId");
