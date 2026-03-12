const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 STARTING DATABASE WIPE...");

    try {
        // Delete all records from the tables
        const deleteReferrals = await prisma.referral.deleteMany();
        console.log(`✅ Cleared Referrals: ${deleteReferrals.count}`);

        const deleteVesting = await prisma.vestingEntry.deleteMany();
        console.log(`✅ Cleared VestingEntries (Investors): ${deleteVesting.count}`);

        const deletePublicSales = await prisma.publicSale.deleteMany();
        console.log(`✅ Cleared PublicSales (Logs): ${deletePublicSales.count}`);

        const deleteActivityLogs = await prisma.activityLog.deleteMany();
        console.log(`✅ Cleared ActivityLogs: ${deleteActivityLogs.count}`);

        const deleteArchivedActivityLogs = await prisma.activityLogArchive.deleteMany();
        console.log(`✅ Cleared ActivityLogArchive: ${deleteArchivedActivityLogs.count}`);

        const deleteConsentLogs = await prisma.consentLog.deleteMany();
        console.log(`✅ Cleared ConsentLogs: ${deleteConsentLogs.count}`);

        // Reset ICOSettings to default
        const resetSettings = await prisma.iCOSettings.upsert({
            where: { id: 1 },
            update: {
                phaseName: "Phase 1: Seed Sale",
                phaseTargetUSD: 5000000.0,
                isActive: true,
                phaseEndDate: null,
                referralActive: false,
                referralPercent: 5.0
            },
            create: {
                id: 1,
                phaseName: "Phase 1: Seed Sale",
                phaseTargetUSD: 5000000.0,
                isActive: true,
                phaseEndDate: null,
                referralActive: false,
                referralPercent: 5.0
            }
        });
        console.log("✅ Reset ICOSettings to Phase 1");

        console.log("\n✨ DATABASE WIPE COMPLETE. SYSTEM IS READY FOR CLEAN TESTING.");
    } catch (error) {
        console.error("❌ FAILED TO WIPE DATABASE:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
