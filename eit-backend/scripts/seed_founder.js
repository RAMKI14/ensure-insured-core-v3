const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// REPLACE THIS WITH YOUR DEPLOYER ADDRESS
const FOUNDER_ADDRESS = "0x9ae21AA27282f615661C1aF7Ba14Cb561ec6A40c"; 

async function main() {
  console.log("🌱 Seeding Founder into Database...");

  try {
    const entry = await prisma.vestingEntry.create({
      data: {
        address: FOUNDER_ADDRESS,
        name: "Founder (You)",
        role: "FOUNDER",
        amount: 7500000000, // 7.5 Billion
        txHash: "DEPLOYMENT_GENESIS_TX", // Placeholder
        isRevoked: false
      }
    });
    console.log("✅ Success! Founder added to DB.");
  } catch (e) {
    console.log("⚠️  Error: Founder likely already in DB.");
  }
}

main();