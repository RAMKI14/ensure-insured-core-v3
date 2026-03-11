const hre = require("hardhat");
const fs = require("fs");

// --- HELPER: Wait Function ---
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("🚀 STARTING ROBUST DEPLOYMENT (With Delays)");
  console.log("👨‍✈️ Admin/Deployer:", deployer.address);
  console.log("----------------------------------------------------");

  // ====================================================
  // 1. DEPLOY INFRASTRUCTURE
  // ====================================================
  console.log("\n1️⃣  Deploying Infrastructure...");

  let oracleAddress, usdtAddress, usdcAddress;
  const networkName = hre.network.name;

  if (networkName === "polygon") {
    // MAINNET
    oracleAddress = "0xAB594600376Ec9fD91F8E885dADF0C639E748e8F";
    usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
  } else {
    // TESTNET
    const MockOracle = await (await hre.ethers.getContractFactory("MockOracle")).deploy();
    await MockOracle.waitForDeployment();
    oracleAddress = await MockOracle.getAddress();

    const MockUSDT = await (await hre.ethers.getContractFactory("MockUSDT")).deploy();
    await MockUSDT.waitForDeployment();
    usdtAddress = await MockUSDT.getAddress();

    const MockUSDC = await (await hre.ethers.getContractFactory("MockUSDT")).deploy();
    await MockUSDC.waitForDeployment();
    usdcAddress = await MockUSDC.getAddress();

    console.log("   - Mocks Deployed.");
    console.log("   - USDT Address:       ", usdtAddress);
    console.log("   - USDC Address we're not testing this:       ", usdcAddress);
    console.log(" Waiting 5s...");
    await delay(5000);
  }

  // ====================================================
  // 2. DEPLOY CORE PROTOCOL
  // ====================================================
  console.log("\n2️⃣  Deploying Core Contracts...");

  // A. TOKEN
  const Token = await (await hre.ethers.getContractFactory("EnsureInsuredToken")).deploy(deployer.address, deployer.address);
  await Token.waitForDeployment();
  const tokenAddr = await Token.getAddress();
  console.log("   - EIT Token:       ", tokenAddr);
  await delay(5000);

  // B. VESTING VAULT
  const Vault = await (await hre.ethers.getContractFactory("EITVestingVault")).deploy(tokenAddr);
  await Vault.waitForDeployment();
  const vaultAddr = await Vault.getAddress();
  console.log("   - Vesting Vault:   ", vaultAddr);
  await delay(5000);

  // C. CROWDSALE
  const Crowdsale = await (await hre.ethers.getContractFactory("EITCrowdsale")).deploy(
    tokenAddr,
    oracleAddress,
    deployer.address,
    deployer.address
  );
  await Crowdsale.waitForDeployment();
  const crowdsaleAddr = await Crowdsale.getAddress();
  console.log("   - Crowdsale:       ", crowdsaleAddr);
  await delay(5000);

  // D. PLATFORM MANAGER
  const Manager = await (await hre.ethers.getContractFactory("EITPlatformManager")).deploy(
    tokenAddr, deployer.address, deployer.address
  );
  await Manager.waitForDeployment();
  const managerAddr = await Manager.getAddress();
  console.log("   - Platform Manager:", managerAddr);
  await delay(5000);

  // E. DISTRIBUTOR
  const Distributor = await (await hre.ethers.getContractFactory("EITDistributor")).deploy();
  await Distributor.waitForDeployment();
  const distributorAddr = await Distributor.getAddress();
  console.log("   - Distributor:     ", distributorAddr);

  console.log("   zzz Waiting 10s for propagation...");
  await delay(10000);

  // ====================================================
  // 3. ALLOCATION LOGIC
  // ====================================================
  console.log("\n3️⃣  Executing Token Allocation...");

  // A. Public Sale: 15B
  const tx1 = await Token.transfer(crowdsaleAddr, hre.ethers.parseEther("15000000000"));
  await tx1.wait();
  console.log("   ✅ 15B sent to Crowdsale");
  console.log("      zzz Waiting 5s...");
  await delay(5000);

  // B. Locked Pool: 17.5B
  const tx2 = await Token.transfer(vaultAddr, hre.ethers.parseEther("17500000000"));
  await tx2.wait();
  console.log("   ✅ 17.5B sent to Vault");
  console.log("      zzz Waiting 5s...");
  await delay(5000);

  // C. Rewards Pool: 2.5B
  const tx3 = await Token.transfer(distributorAddr, hre.ethers.parseEther("2500000000"));
  await tx3.wait();
  console.log("   ✅ 2.5B sent to Distributor");
  console.log("      zzz Waiting 5s...");
  await delay(5000);

  // D. Inventory Check
  const adminBalance = await Token.balanceOf(deployer.address);
  console.log(`   ✅ Remaining ${hre.ethers.formatEther(adminBalance)} EIT held by Admin`);

  // ====================================================
  // 4. SETUP & PERMISSIONS
  // ====================================================
  console.log("\n4️⃣  Configuring System...");

  const TGE = Math.floor(Date.now() / 1000);
  const ONE_YEAR = 31536000;

  // A. Lock Founder Tokens
  const tx4 = await Vault.createVestingSchedule(
    deployer.address,
    hre.ethers.parseEther("7500000000"),
    TGE,
    ONE_YEAR,
    ONE_YEAR * 4,
    false
  );
  await tx4.wait();
  console.log("   ✅ Founder Schedule Created");
  console.log("      zzz Waiting 5s...");
  await delay(5000);

  // B. Approve Manager
  const tx5 = await Token.approve(managerAddr, hre.ethers.parseEther("15000000000"));
  await tx5.wait();
  console.log("   ✅ Platform Manager Approved");

  // ====================================================
  // 5. Verify contracts on Etherscan
  // ====================================================
  await hre.run("verify:verify", {
    address: tokenAddr,
    constructorArguments: [deployer.address, deployer.address],
  });

  // ====================================================
  // 6. SAVE CONFIG
  // ====================================================
  const config = {
    EIT: tokenAddr,
    USDT: usdtAddress,
    CROWDSALE: crowdsaleAddr,
    VESTING_VAULT: vaultAddr,
    MANAGER: managerAddr,
    DISTRIBUTOR: distributorAddr,
    OWNER_ADDRESS: deployer.address
  };

  fs.writeFileSync("frontend-config.json", JSON.stringify(config, null, 2));

  if (fs.existsSync("./eit-backend")) fs.writeFileSync("./eit-backend/frontend-config.json", JSON.stringify(config, null, 2));
  if (fs.existsSync("./frontend/src")) fs.writeFileSync("./frontend/src/frontend-config.json", JSON.stringify(config, null, 2));
  if (fs.existsSync("../eit-admin-v2")) {
    fs.writeFileSync("../eit-admin-v2/frontend-config.json", JSON.stringify(config, null, 2));
    const adminSrc = "../eit-admin-v2/src";
    if (fs.existsSync(adminSrc)) fs.writeFileSync(`${adminSrc}/frontend-config.json`, JSON.stringify(config, null, 2));
  }

  console.log("\n🎉 DEPLOYMENT SUCCESSFUL! (Slow & Steady)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});