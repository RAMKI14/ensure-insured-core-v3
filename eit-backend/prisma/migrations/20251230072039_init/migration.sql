-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
