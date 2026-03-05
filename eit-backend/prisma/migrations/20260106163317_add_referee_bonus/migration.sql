/*
  Warnings:

  - You are about to drop the column `rewardEIT` on the `Referral` table. All the data in the column will be lost.
  - Added the required column `refereeBonus` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerReward` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Referral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referrer" TEXT NOT NULL,
    "referee" TEXT NOT NULL,
    "purchaseAmount" REAL NOT NULL,
    "referrerReward" REAL NOT NULL,
    "refereeBonus" REAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Referral" ("id", "purchaseAmount", "referee", "referrer", "status", "timestamp", "txHash") SELECT "id", "purchaseAmount", "referee", "referrer", "status", "timestamp", "txHash" FROM "Referral";
DROP TABLE "Referral";
ALTER TABLE "new_Referral" RENAME TO "Referral";
CREATE UNIQUE INDEX "Referral_txHash_key" ON "Referral"("txHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
