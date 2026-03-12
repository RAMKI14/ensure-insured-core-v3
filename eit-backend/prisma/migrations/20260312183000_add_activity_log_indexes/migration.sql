CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

CREATE INDEX "ActivityLog_severity_idx" ON "ActivityLog"("severity");

CREATE INDEX "ActivityLog_admin_idx" ON "ActivityLog"("admin");

CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

CREATE INDEX "ActivityLog_severity_timestamp_idx" ON "ActivityLog"("severity", "timestamp");
