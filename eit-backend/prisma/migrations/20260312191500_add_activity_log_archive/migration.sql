CREATE TABLE "ActivityLogArchive" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalLogId" INTEGER,
    "admin" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "ipAddress" TEXT,
    "location" TEXT,
    "txHash" TEXT,
    "timestamp" DATETIME NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveReason" TEXT NOT NULL DEFAULT 'RETENTION'
);

CREATE INDEX "ActivityLogArchive_originalLogId_idx" ON "ActivityLogArchive"("originalLogId");
CREATE INDEX "ActivityLogArchive_timestamp_idx" ON "ActivityLogArchive"("timestamp");
CREATE INDEX "ActivityLogArchive_archivedAt_idx" ON "ActivityLogArchive"("archivedAt");
CREATE INDEX "ActivityLogArchive_severity_idx" ON "ActivityLogArchive"("severity");
CREATE INDEX "ActivityLogArchive_action_idx" ON "ActivityLogArchive"("action");
