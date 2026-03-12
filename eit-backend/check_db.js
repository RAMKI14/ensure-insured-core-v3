const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sales = await prisma.publicSale.findMany();
    console.log("Public Sales:", sales);
    
    const vesting = await prisma.vestingEntry.findMany();
    console.log("Vesting (Private/Seed):", vesting.length);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
