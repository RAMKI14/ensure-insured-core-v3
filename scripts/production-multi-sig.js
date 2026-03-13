const hre = require("hardhat");
const fs = require("fs");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

function validateAddress(label, value) {
  if (!hre.ethers.isAddress(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
}

function writeConfig(config) {
  const serialized = JSON.stringify(config, null, 2);
  const targets = [
    "frontend-config.json",
    "./eit-backend/frontend-config.json",
    "./frontend/src/frontend-config.json",
    "../eit-admin-v2/frontend-config.json",
    "../eit-admin-v2/src/frontend-config.json",
  ];

  for (const target of targets) {
    const dir = target.includes("/") ? target.slice(0, target.lastIndexOf("/")) : ".";
    if (fs.existsSync(dir)) {
      fs.writeFileSync(target, serialized);
      console.log(`   - Updated ${target}`);
    }
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  // Final production model:
  // - Admin Safe: governance / high-risk admin
  // - Treasury Safe: custody / milestone releases / distributor ownership
  // - Ops Wallet: day-to-day operations
  // - Pauser Wallet: fast emergency pause wallet (recommended same as Ops Wallet)
  // - Vesting Owner: day-to-day HR wallet (recommended same as Ops Wallet)
  const adminSafe = validateAddress("PROD_ADMIN_SAFE", requireEnv("PROD_ADMIN_SAFE"));
  const treasurySafe = validateAddress("PROD_TREASURY_SAFE", requireEnv("PROD_TREASURY_SAFE"));
  const opsWallet = validateAddress("PROD_OPS_WALLET", requireEnv("PROD_OPS_WALLET"));
  const pauserWallet = validateAddress("PROD_PAUSER_WALLET", optionalEnv("PROD_PAUSER_WALLET", opsWallet));
  const recycleTreasury = validateAddress("PROD_RECYCLE_TREASURY", optionalEnv("PROD_RECYCLE_TREASURY", treasurySafe));
  const distributorOwner = validateAddress("PROD_DISTRIBUTOR_OWNER", optionalEnv("PROD_DISTRIBUTOR_OWNER", treasurySafe));
  const vestingOwner = validateAddress("PROD_VESTING_OWNER", optionalEnv("PROD_VESTING_OWNER", opsWallet));

  console.log("----------------------------------------------------");
  console.log("🚀 STARTING PRODUCTION MULTISIG DEPLOYMENT");
  console.log("Network:                ", networkName);
  console.log("Deployer:               ", deployer.address);
  console.log("Admin Safe:             ", adminSafe);
  console.log("Treasury Safe:          ", treasurySafe);
  console.log("Ops Wallet:             ", opsWallet);
  console.log("Pauser Wallet:          ", pauserWallet);
  console.log("Recycle Treasury:       ", recycleTreasury);
  console.log("Distributor Owner:      ", distributorOwner);
  console.log("Vesting Owner:          ", vestingOwner);
  console.log("----------------------------------------------------");

  if (pauserWallet.toLowerCase() !== opsWallet.toLowerCase()) {
    console.log("⚠️  Note: PROD_PAUSER_WALLET differs from PROD_OPS_WALLET.");
    console.log("   Current contract version ties pause/unpause to crowdsale admin privileges.");
    console.log("   Use a separate pauser only if you intentionally want another privileged hot wallet.");
  }

  let oracleAddress;
  let usdtAddress;
  let usdcAddress;

  if (networkName === "polygon") {
    oracleAddress = "0xAB594600376Ec9fD91F8E885dADF0C639E748e8F";
    usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
  } else {
    const MockOracle = await hre.ethers.getContractFactory("MockOracle");
    const mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();
    oracleAddress = await mockOracle.getAddress();

    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const mockUsdt = await MockUSDT.deploy();
    await mockUsdt.waitForDeployment();
    usdtAddress = await mockUsdt.getAddress();

    const mockUsdc = await MockUSDT.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();

    console.log("   - Mock Oracle:       ", oracleAddress);
    console.log("   - Mock USDT:         ", usdtAddress);
    console.log("   - Mock USDC:         ", usdcAddress);
    await delay(3000);
  }

  console.log("\n1️⃣ Deploying core contracts...");

  const Token = await hre.ethers.getContractFactory("EnsureInsuredToken");
  const token = await Token.deploy(deployer.address, pauserWallet);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("   - EIT Token:         ", tokenAddr);
  await delay(2000);

  const Vault = await hre.ethers.getContractFactory("EITVestingVault");
  const vault = await Vault.deploy(tokenAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   - Vesting Vault:     ", vaultAddr);
  await delay(2000);

  const Crowdsale = await hre.ethers.getContractFactory("EITCrowdsale");
  const crowdsale = await Crowdsale.deploy(tokenAddr, oracleAddress, treasurySafe, adminSafe);
  await crowdsale.waitForDeployment();
  const crowdsaleAddr = await crowdsale.getAddress();
  console.log("   - Crowdsale:         ", crowdsaleAddr);
  await delay(2000);

  const Manager = await hre.ethers.getContractFactory("EITPlatformManager");
  const manager = await Manager.deploy(tokenAddr, recycleTreasury, adminSafe);
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log("   - Platform Manager:  ", managerAddr);
  await delay(2000);

  const Distributor = await hre.ethers.getContractFactory("EITDistributor");
  const distributor = await Distributor.deploy();
  await distributor.waitForDeployment();
  const distributorAddr = await distributor.getAddress();
  console.log("   - Distributor:       ", distributorAddr);
  await delay(2000);

  console.log("\n2️⃣ Funding protocol inventories...");

  await (await token.transfer(crowdsaleAddr, hre.ethers.parseEther("15000000000"))).wait();
  console.log("   ✅ 15B EIT -> Crowdsale");

  await (await token.transfer(vaultAddr, hre.ethers.parseEther("17500000000"))).wait();
  console.log("   ✅ 17.5B EIT -> Vesting Vault");

  await (await token.transfer(distributorAddr, hre.ethers.parseEther("2500000000"))).wait();
  console.log("   ✅ 2.5B EIT -> Distributor");

  const remaining = await token.balanceOf(deployer.address);
  console.log(`   ✅ Remaining deployer balance: ${hre.ethers.formatEther(remaining)} EIT`);

  console.log("\n3️⃣ Writing config...");

  const config = {
    EIT: tokenAddr,
    USDT: usdtAddress,
    USDC: usdcAddress,
    CROWDSALE: crowdsaleAddr,
    VESTING_VAULT: vaultAddr,
    MANAGER: managerAddr,
    DISTRIBUTOR: distributorAddr,
    OWNER_ADDRESS: deployer.address,
    ADMIN_SAFE: adminSafe,
    TREASURY_SAFE: treasurySafe,
    OPS_WALLET: opsWallet,
    PAUSER_WALLET: pauserWallet,
    RECYCLE_TREASURY: recycleTreasury,
    DISTRIBUTOR_OWNER: distributorOwner,
    VESTING_OWNER: vestingOwner
  };

  writeConfig(config);

  console.log("\n4️⃣ Next required step");
  console.log("Run the post-deploy handoff script before production use:");
  console.log("npx hardhat run scripts/post_deploy_handoff.js --network", networkName);

  console.log("\n🎉 Production multisig deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
