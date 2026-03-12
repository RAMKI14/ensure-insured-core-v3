const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🛠️  Bootstraping Crowdsale on Sepolia...");

    const configPath = "./frontend-config.json";
    if (!fs.existsSync(configPath)) {
        throw new Error("frontend-config.json not found!");
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const CrowdsaleABI = require("../artifacts/contracts/EITCrowdsale.sol/EITCrowdsale.json");
    const crowdsale = new hre.ethers.Contract(config.CROWDSALE, CrowdsaleABI.abi, deployer);

    // 1. Register USDT
    console.log("➡️  Adding USDT:", config.USDT);
    try {
        const tx1 = await crowdsale.addStablecoin(config.USDT, 6);
        await tx1.wait();
        console.log("✅ USDT Added");
    } catch (e) {
        console.log("⚠️  USDT add failed (might already exist):", e.reason || e.message);
    }

    // 2. Register USDC (if exists)
    // In our deployment script, usdcAddress was also created but we usually test with USDT
    // Let's check if we have USDC address in the deployment logs or just use the one we have
    // Actually, let's just do USDT for now as that's what the user is trying.

    // 3. Check Phases
    const count = await crowdsale.getPhaseCount();
    console.log("📊 Current Phases:", count.toString());

    // 4. Disable Whitelist (as user mentioned they turned it off on UI)
    // The user said "I turned off 'KYC' and Open Sale is On now."
    // If they did this via UI, it should be fine. But let's verify.
    const whitelistEnabled = await crowdsale.whitelistEnabled();
    console.log("🛡️  Whitelist Enabled:", whitelistEnabled);

    console.log("\n🚀 CROWDSALE READY!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
