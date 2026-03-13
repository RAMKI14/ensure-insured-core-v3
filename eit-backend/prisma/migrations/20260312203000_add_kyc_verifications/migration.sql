CREATE TABLE "KycVerification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL DEFAULT 'decentralized_identity',
    "status" TEXT NOT NULL DEFAULT 'VERIFIED_PENDING_WHITELIST',
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "KycVerification_walletAddress_key" ON "KycVerification"("walletAddress");
CREATE INDEX "KycVerification_provider_idx" ON "KycVerification"("provider");
CREATE INDEX "KycVerification_status_idx" ON "KycVerification"("status");
CREATE INDEX "KycVerification_verifiedAt_idx" ON "KycVerification"("verifiedAt");
