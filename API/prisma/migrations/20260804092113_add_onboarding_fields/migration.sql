-- AlterTable
ALTER TABLE "User" ADD COLUMN     "irataLevel" TEXT,
ADD COLUMN     "irataNumber" TEXT,
ADD COLUMN     "preferredAirportCity" TEXT,
ADD COLUMN     "preferredAirportCountry" TEXT,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "windaId" TEXT;
