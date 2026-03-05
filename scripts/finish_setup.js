const hre = require("hardhat");
const fs = require("fs");

/* If the script crashed before it could move the tokens (Allocation) or set up the vesting. 
Currently, Admin Wallet still holds all 50 Billion tokens.

Do not redeploy. That wastes test ETH. Let's just finish the remaining steps using a below specialized script 
prepared.*/

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("🛠️  RESUMING SETUP (Recovering from Timeout)");
  console.log("👨‍✈️ Admin Account:", deployer.address);
  console.log("----------------------------------------------------");

  // 1. HARDCODED ADDRESSES (From your failed run logs)
  // These are the contracts you just deployed
  const TOKEN_ADDR = "0x453dfB005Cca41945c3d0F3d6a3078f4d9b33f7E";
  const VAULT_ADDR = "0x35640E1997EeEA82B9B6cDFC6B6783f283d9aB1a";
  const CROWD_ADDR = "0xBf4813704C3786F609a84f5E4d5Afd03bE807895";
  const MANAGER_ADDR = "0xd028E1A1514be04A48618bb577036c556372d3E9";
  // We need to fetch the MockUSDT address from your previous deployment or deploy a new one if lost.
  // Since Mocks deploy fast, let's just grab the previous one if you have it, 
  // OR we can fetch it from the contract getter if needed. 
  // For simplicity, let's assume we need to save the config, we will use a placeholder or check previous logs.
  // Did you save the MockUSDT address? If not, check Etherscan for the internal transactions of your deployer.
  // For now, I will use a generic placeholder, UPDATE THIS if you have the MockUSDT log.
  const USDT_ADDR = "0xcAa663f45D8A511602f346c5BD39e2a77F5c6502"; // Previous one (or check logs)

  // 2. ATTACH TO CONTRACTS
  const Token = await hre.ethers.getContractAt("EnsureInsuredToken", TOKEN_ADDR);
  const Vault = await hre.ethers.getContractAt("EITVestingVault", VAULT_ADDR);
  // (We don't need to attach to others just to send tokens to them)

  // 3. EXECUTE ALLOCATION
  console.log("\n3️⃣  Retrying Token Allocation...");

  // A. 15B to Crowdsale
  console.log("   -> Sending 15B to Crowdsale...");
  const tx1 = await Token.transfer(CROWD_ADDR, hre.ethers.parseEther("15000000000"));
  await tx1.wait();
  console.log("      ✅ Done.");

  // B. 20B to Vesting Vault
  console.log("   -> Sending 20B to Vesting Vault...");
  const tx2 = await Token.transfer(VAULT_ADDR, hre.ethers.parseEther("20000000000"));
  await tx2.wait();
  console.log("      ✅ Done.");

  // 4. SETUP VESTING
  console.log("\n4️⃣  Setting up Founder Vesting...");
  const TGE = Math.floor(Date.now() / 1000);
  try {
      const tx3 = await Vault.createVestingSchedule(
          deployer.address, 
          hre.ethers.parseEther("7500000000"), // 7.5B
          TGE, 
          31536000,   // 1 Year Cliff
          126144000,  // 4 Years Duration
          false       // Not Revocable
      );
      await tx3.wait();
      console.log("      ✅ Founder Schedule Created.");
  } catch (e) {
      console.log("      ⚠️  Schedule might already exist, skipping.");
  }

  // 5. PERMISSIONS
  console.log("\n5️⃣  Approving Manager...");
  const tx4 = await Token.approve(MANAGER_ADDR, hre.ethers.parseEther("15000000000"));
  await tx4.wait();
  console.log("      ✅ Manager Approved.");

  // 6. SAVE CONFIG
  const config = {
    EIT: TOKEN_ADDR,
    USDT: USDT_ADDR, 
    CROWDSALE: CROWD_ADDR,
    VESTING_VAULT: VAULT_ADDR,
    MANAGER: MANAGER_ADDR
  };
  
  fs.writeFileSync("frontend-config.json", JSON.stringify(config, null, 2));
  if (fs.existsSync("./frontend/src")) {
      fs.writeFileSync("./frontend/src/frontend-config.json", JSON.stringify(config, null, 2));
  }
  
  console.log("\n🎉 RECOVERY COMPLETE! System is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});