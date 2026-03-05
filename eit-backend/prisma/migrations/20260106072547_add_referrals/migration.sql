-- CreateTable
CREATE TABLE "Referral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referrer" TEXT NOT NULL,
    "referee" TEXT NOT NULL,
    "purchaseAmount" REAL NOT NULL,
    "rewardEIT" REAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ICOSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "phaseName" TEXT NOT NULL DEFAULT 'Phase 1: Seed Round',
    "phaseTargetUSD" REAL NOT NULL DEFAULT 5000000.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referralActive" BOOLEAN NOT NULL DEFAULT false,
    "referralPercent" REAL NOT NULL DEFAULT 5.0
);
INSERT INTO "new_ICOSettings" ("id", "isActive", "phaseName", "phaseTargetUSD") SELECT "id", "isActive", "phaseName", "phaseTargetUSD" FROM "ICOSettings";
DROP TABLE "ICOSettings";
ALTER TABLE "new_ICOSettings" RENAME TO "ICOSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Referral_txHash_key" ON "Referral"("txHash");
