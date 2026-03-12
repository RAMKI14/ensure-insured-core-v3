const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking VestingEntry table...");
    try {
        const entries = await prisma.vestingEntry.findMany({
            where: {
                role: { startsWith: 'PUBLIC_' }
            }
        });
        console.log(`Found ${entries.length} public sale entries.`);
        entries.forEach((e, i) => {
            console.log(`Entry ${i+1}:`);
            console.log(`  Address: ${e.address}`);
            console.log(`  Role: ${e.role}`);
            console.log(`  Amount: ${e.amount} EIT`);
            console.log(`  Amount USD: ${e.amountUSD}`);
        });
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
