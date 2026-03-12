const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BATCH_SIZE = Number(process.env.ACTIVITY_ARCHIVE_BATCH_SIZE || 250);
const INFO_RETENTION_DAYS = Number(process.env.ACTIVITY_INFO_RETENTION_DAYS || 30);
const WARNING_RETENTION_DAYS = Number(process.env.ACTIVITY_WARNING_RETENTION_DAYS || 365);
const DRY_RUN = process.env.DRY_RUN === '1';

function daysAgo(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function archiveBatch(where, archiveReason) {
    const logs = await prisma.activityLog.findMany({
        where,
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
    });

    if (logs.length === 0) {
        return 0;
    }

    if (DRY_RUN) {
        console.log(`DRY RUN: would archive ${logs.length} log(s) for ${archiveReason}`);
        return logs.length;
    }

    await prisma.$transaction([
        prisma.activityLogArchive.createMany({
            data: logs.map((log) => ({
                originalLogId: log.id,
                admin: log.admin,
                action: log.action,
                details: log.details,
                severity: log.severity,
                ipAddress: log.ipAddress,
                location: log.location,
                txHash: log.txHash,
                timestamp: log.timestamp,
                archiveReason,
            })),
        }),
        prisma.activityLog.deleteMany({
            where: { id: { in: logs.map((log) => log.id) } },
        }),
    ]);

    return logs.length;
}

async function archiveUntilDone(where, archiveReason) {
    let total = 0;
    while (true) {
        const moved = await archiveBatch(where, archiveReason);
        if (moved === 0) break;
        total += moved;
        if (DRY_RUN) break;
    }
    return total;
}

async function countMaintenanceTargets() {
    const [panelViews, oldInfo, oldWarnings, archiveCount, hotCount] = await Promise.all([
        prisma.activityLog.count({ where: { action: 'PANEL_VIEW' } }),
        prisma.activityLog.count({
            where: {
                severity: 'INFO',
                timestamp: { lt: daysAgo(INFO_RETENTION_DAYS) },
                action: { not: 'PANEL_VIEW' },
            },
        }),
        prisma.activityLog.count({
            where: {
                severity: 'WARNING',
                timestamp: { lt: daysAgo(WARNING_RETENTION_DAYS) },
            },
        }),
        prisma.activityLogArchive.count(),
        prisma.activityLog.count(),
    ]);

    return { panelViews, oldInfo, oldWarnings, archiveCount, hotCount };
}

async function main() {
    console.log('🗃️ Activity log maintenance started');
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`INFO retention: ${INFO_RETENTION_DAYS} days`);
    console.log(`WARNING retention: ${WARNING_RETENTION_DAYS} days`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);

    const before = await countMaintenanceTargets();
    console.log('Before:', before);

    const archivedPanelViews = await archiveUntilDone(
        { action: 'PANEL_VIEW' },
        'PANEL_VIEW_CLEANUP'
    );

    const archivedInfo = await archiveUntilDone(
        {
            severity: 'INFO',
            timestamp: { lt: daysAgo(INFO_RETENTION_DAYS) },
            action: { not: 'PANEL_VIEW' },
        },
        'INFO_RETENTION'
    );

    const archivedWarnings = await archiveUntilDone(
        {
            severity: 'WARNING',
            timestamp: { lt: daysAgo(WARNING_RETENTION_DAYS) },
        },
        'WARNING_RETENTION'
    );

    const after = await countMaintenanceTargets();
    console.log('After:', after);
    console.log('Archived this run:', {
        panelViews: archivedPanelViews,
        info: archivedInfo,
        warnings: archivedWarnings,
    });
}

main()
    .catch((error) => {
        console.error('❌ Activity log maintenance failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
