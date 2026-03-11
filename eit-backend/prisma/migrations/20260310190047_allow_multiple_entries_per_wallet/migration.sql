/*
  Warnings:

  - The primary key for the `VestingEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `VestingEntry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VestingEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT,
    "note" TEXT,
    "crypto" TEXT,
    "amount" REAL NOT NULL,
    "amountUSD" REAL,
    "eitPrice" REAL,
    "phase" TEXT,
    "country" TEXT,
    "txHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VestingEntry" ("address", "amount", "amountUSD", "category", "country", "createdAt", "crypto", "eitPrice", "isRevoked", "name", "note", "phase", "role", "txHash") SELECT "address", "amount", "amountUSD", "category", "country", "createdAt", "crypto", "eitPrice", "isRevoked", "name", "note", "phase", "role", "txHash" FROM "VestingEntry";
DROP TABLE "VestingEntry";
ALTER TABLE "new_VestingEntry" RENAME TO "VestingEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
