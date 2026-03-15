const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 STARTING DATABASE WIPE...");

    try {
        // 1. Referral
        const deleteReferrals = await prisma.referral.deleteMany();
        console.log(`✅ Cleared Referrals: ${deleteReferrals.count}`);

        // 2. VestingEntry
        const deleteVesting = await prisma.vestingEntry.deleteMany();
        console.log(`✅ Cleared VestingEntries (Investors): ${deleteVesting.count}`);

        // 3. PublicSale
        const deletePublicSales = await prisma.publicSale.deleteMany();
        console.log(`✅ Cleared PublicSales (Logs): ${deletePublicSales.count}`);

        // 4. ActivityLog
        const deleteActivityLogs = await prisma.activityLog.deleteMany();
        console.log(`✅ Cleared ActivityLogs: ${deleteActivityLogs.count}`);

        // 5. ActivityLogArchive
        const deleteArchivedActivityLogs = await prisma.activityLogArchive.deleteMany();
        console.log(`✅ Cleared ActivityLogArchive: ${deleteArchivedActivityLogs.count}`);

        // 6. KycVerification
        const deleteKycVerifications = await prisma.kycVerification.deleteMany();
        console.log(`✅ Cleared KycVerifications: ${deleteKycVerifications.count}`);

        // 7. ConsentLog
        const deleteConsentLogs = await prisma.consentLog.deleteMany();
        console.log(`✅ Cleared ConsentLogs: ${deleteConsentLogs.count}`);

        // 8. BurnLog
        const deleteBurnLogs = await prisma.burnLog.deleteMany();
        console.log(`✅ Cleared BurnLogs: ${deleteBurnLogs.count}`);

        // 9. Reset ICOSettings to default
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
