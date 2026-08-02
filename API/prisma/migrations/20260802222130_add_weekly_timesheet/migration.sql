-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogAction" ADD VALUE 'TIMESHEET_CREATE';
ALTER TYPE "LogAction" ADD VALUE 'TIMESHEET_UPDATE';
ALTER TYPE "LogAction" ADD VALUE 'TIMESHEET_DELETE';
ALTER TYPE "LogAction" ADD VALUE 'TIMESHEET_SUBMIT';
ALTER TYPE "LogAction" ADD VALUE 'TIMESHEET_APPROVE';

-- CreateTable
CREATE TABLE "WeeklyTimesheet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobNumber" TEXT,
    "week" TEXT NOT NULL,
    "teamNo" TEXT,
    "jobScope" TEXT,
    "client" TEXT,
    "siteName" TEXT,
    "createdBy" TEXT NOT NULL,
    "technicianName" TEXT,
    "technicianSignature" TEXT,
    "technicianDate" TIMESTAMP(3),
    "clientName" TEXT,
    "clientSignature" TEXT,
    "clientDate" TIMESTAMP(3),
    "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WeeklyTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTimesheetDay" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayName" TEXT NOT NULL,
    "progress" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyTimesheetDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTimesheetEntry" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "userId" TEXT,
    "technicianName" TEXT NOT NULL,
    "role" TEXT,
    "localTurbineNo" TEXT,
    "turbineIdNo" TEXT,
    "towerNo" TEXT,
    "bladeNo" TEXT,
    "standbyHrs" TEXT,
    "workingHrs" TEXT,
    "travelHrs" TEXT,
    "downtimeHrs" TEXT,
    "standbyReason" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyTimesheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyTimesheet_projectId_idx" ON "WeeklyTimesheet"("projectId");

-- CreateIndex
CREATE INDEX "WeeklyTimesheet_createdBy_idx" ON "WeeklyTimesheet"("createdBy");

-- CreateIndex
CREATE INDEX "WeeklyTimesheet_week_idx" ON "WeeklyTimesheet"("week");

-- CreateIndex
CREATE INDEX "WeeklyTimesheet_status_idx" ON "WeeklyTimesheet"("status");

-- CreateIndex
CREATE INDEX "WeeklyTimesheetDay_timesheetId_idx" ON "WeeklyTimesheetDay"("timesheetId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyTimesheetDay_timesheetId_date_key" ON "WeeklyTimesheetDay"("timesheetId", "date");

-- CreateIndex
CREATE INDEX "WeeklyTimesheetEntry_dayId_idx" ON "WeeklyTimesheetEntry"("dayId");

-- CreateIndex
CREATE INDEX "WeeklyTimesheetEntry_userId_idx" ON "WeeklyTimesheetEntry"("userId");

-- AddForeignKey
ALTER TABLE "WeeklyTimesheet" ADD CONSTRAINT "WeeklyTimesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimesheet" ADD CONSTRAINT "WeeklyTimesheet_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimesheetDay" ADD CONSTRAINT "WeeklyTimesheetDay_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "WeeklyTimesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimesheetEntry" ADD CONSTRAINT "WeeklyTimesheetEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "WeeklyTimesheetDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimesheetEntry" ADD CONSTRAINT "WeeklyTimesheetEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
