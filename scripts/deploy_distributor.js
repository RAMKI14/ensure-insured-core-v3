const hre = require("hardhat");
const fs = require("fs");
const existingConfig = require("../frontend-config.json"); // Load existing addresses

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying Distributor with:", deployer.address);

  // 1. Deploy
  const Distributor = await hre.ethers.getContractFactory("EITDistributor");
  const distributor = await Distributor.deploy();
  await distributor.waitForDeployment();
  const distAddress = await distributor.getAddress();
  
  console.log("✅ EITDistributor deployed at:", distAddress);

  // 2. Update Config
  const newConfig = {
      ...existingConfig,
      DISTRIBUTOR: distAddress
  };

  // Save to both locations
  fs.writeFileSync("frontend-config.json", JSON.stringify(newConfig, null, 2));
  
  // Try copying to admin frontend
  const adminPath = "./eit-admin/src/frontend-config.json"; 
  // Note: You might need to manually update paths if your folder structure varies
  if (fs.existsSync("../eit-admin/src")) {
      fs.writeFileSync("../eit-admin/src/frontend-config.json", JSON.stringify(newConfig, null, 2));
      console.log("Updated Admin Config");
  } else {
      console.log("⚠️ Please manually copy the new frontend-config.json to eit-admin/src/");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});