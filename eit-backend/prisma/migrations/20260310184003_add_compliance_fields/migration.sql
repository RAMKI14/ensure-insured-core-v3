-- AlterTable
ALTER TABLE "ICOSettings" ADD COLUMN "phaseEndDate" DATETIME;

-- AlterTable
ALTER TABLE "VestingEntry" ADD COLUMN "amountUSD" REAL;
ALTER TABLE "VestingEntry" ADD COLUMN "category" TEXT;
ALTER TABLE "VestingEntry" ADD COLUMN "country" TEXT;
ALTER TABLE "VestingEntry" ADD COLUMN "crypto" TEXT;
ALTER TABLE "VestingEntry" ADD COLUMN "eitPrice" REAL;
ALTER TABLE "VestingEntry" ADD COLUMN "note" TEXT;
ALTER TABLE "VestingEntry" ADD COLUMN "phase" TEXT;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "admin" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "ipAddress" TEXT,
    "location" TEXT,
    "txHash" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
