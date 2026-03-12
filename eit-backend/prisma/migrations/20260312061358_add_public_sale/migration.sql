-- CreateTable
CREATE TABLE "PublicSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Public Investor',
    "role" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "amountUSD" REAL,
    "eitPrice" REAL,
    "txHash" TEXT NOT NULL,
    "phase" TEXT,
    "country" TEXT,
    "crypto" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicSale_txHash_key" ON "PublicSale"("txHash");
