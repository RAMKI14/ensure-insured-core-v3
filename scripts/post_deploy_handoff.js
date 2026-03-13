const hre = require("hardhat");
const fs = require("fs");

const CROWDSALE_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function grantRole(bytes32,address)",
  "function revokeRole(bytes32,address)"
];

const MANAGER_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function grantRole(bytes32,address)",
  "function revokeRole(bytes32,address)"
];

const TOKEN_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function grantRole(bytes32,address)",
  "function revokeRole(bytes32,address)"
];

const OWNABLE_ABI = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)"
];

function requireEnv(name, fallback = null) {
  const value = process.env[name];
  if (value && value.trim() !== "") return value.trim();
  if (fallback !== null) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function readConfig() {
  const path = "./frontend-config.json";
  if (!fs.existsSync(path)) {
    throw new Error("Missing frontend-config.json");
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

async function ensureRole(contract, role, holder, signerLabel) {
  const hasRole = await contract.hasRole(role, holder);
  if (hasRole) {
    console.log(`   - ${signerLabel} already has role ${role}`);
    return;
  }
  const tx = await contract.grantRole(role, holder);
  await tx.wait();
  console.log(`   ✅ Granted ${role} to ${holder}`);
}

async function revokeRoleIfPresent(contract, role, holder) {
  const hasRole = await contract.hasRole(role, holder);
  if (!hasRole) {
    return;
  }
  const tx = await contract.revokeRole(role, holder);
  await tx.wait();
  console.log(`   ✅ Revoked ${role} from ${holder}`);
}

async function transferOwnershipIfNeeded(contract, currentOwner, targetOwner, label) {
  if (currentOwner.toLowerCase() === targetOwner.toLowerCase()) {
    console.log(`   - ${label} already owned by ${targetOwner}`);
    return;
  }
  const tx = await contract.transferOwnership(targetOwner);
  await tx.wait();
  console.log(`   ✅ ${label} ownership transferred to ${targetOwner}`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const config = readConfig();

  // Final production model:
  // - Admin Safe: governance / high-risk actions
  // - Treasury Safe: custody / treasury ownership
  // - Ops Wallet: whitelist, routine ops, HR
  // - Pauser Wallet: fast emergency pause wallet (recommended same as Ops Wallet)
  // - Vesting Owner: recommended same as Ops Wallet
  const adminSafe = requireEnv("PROD_ADMIN_SAFE", config.ADMIN_SAFE);
  const treasurySafe = requireEnv("PROD_TREASURY_SAFE", config.TREASURY_SAFE);
  const opsWallet = requireEnv("PROD_OPS_WALLET", config.OPS_WALLET);
  const pauserWallet = requireEnv("PROD_PAUSER_WALLET", config.PAUSER_WALLET || opsWallet);
  const distributorOwner = requireEnv("PROD_DISTRIBUTOR_OWNER", config.DISTRIBUTOR_OWNER || treasurySafe);
  const vestingOwner = requireEnv("PROD_VESTING_OWNER", config.VESTING_OWNER || opsWallet);

  console.log("----------------------------------------------------");
  console.log("🔐 POST-DEPLOY HANDOFF");
  console.log("Network:                ", hre.network.name);
  console.log("Deployer:               ", deployer.address);
  console.log("Admin Safe:             ", adminSafe);
  console.log("Treasury Safe:          ", treasurySafe);
  console.log("Ops Wallet:             ", opsWallet);
  console.log("Pauser Wallet:          ", pauserWallet);
  console.log("Distributor Owner:      ", distributorOwner);
  console.log("Vesting Owner:          ", vestingOwner);
  console.log("----------------------------------------------------");

  if (pauserWallet.toLowerCase() !== opsWallet.toLowerCase()) {
    console.log("⚠️  Note: pauser wallet is separate from ops wallet.");
    console.log("   In the current crowdsale contract, pause/unpause requires DEFAULT_ADMIN_ROLE.");
    console.log("   This means the pauser wallet will also receive crowdsale admin power.");
  }

  const token = new hre.ethers.Contract(config.EIT, TOKEN_ABI, deployer);
  const crowdsale = new hre.ethers.Contract(config.CROWDSALE, CROWDSALE_ABI, deployer);
  const manager = new hre.ethers.Contract(config.MANAGER, MANAGER_ABI, deployer);
  const distributor = new hre.ethers.Contract(config.DISTRIBUTOR, OWNABLE_ABI, deployer);
  const vestingVault = new hre.ethers.Contract(config.VESTING_VAULT, OWNABLE_ABI, deployer);

  console.log("\n1️⃣ Token roles");
  const tokenAdminRole = await token.DEFAULT_ADMIN_ROLE();
  const tokenPauserRole = await token.PAUSER_ROLE();
  await ensureRole(token, tokenAdminRole, adminSafe, "Admin Safe");
  await ensureRole(token, tokenPauserRole, pauserWallet, "Pauser Wallet");
  if (deployer.address.toLowerCase() !== adminSafe.toLowerCase()) {
    await revokeRoleIfPresent(token, tokenAdminRole, deployer.address);
  }

  console.log("\n2️⃣ Crowdsale roles");
  const crowdsaleAdminRole = await crowdsale.DEFAULT_ADMIN_ROLE();
  const crowdsaleOperatorRole = await crowdsale.OPERATOR_ROLE();
  await ensureRole(crowdsale, crowdsaleAdminRole, adminSafe, "Admin Safe");
  await ensureRole(crowdsale, crowdsaleAdminRole, pauserWallet, "Pauser Wallet");
  await ensureRole(crowdsale, crowdsaleOperatorRole, opsWallet, "Ops Wallet");
  if (deployer.address.toLowerCase() !== adminSafe.toLowerCase() && deployer.address.toLowerCase() !== pauserWallet.toLowerCase()) {
    await revokeRoleIfPresent(crowdsale, crowdsaleOperatorRole, deployer.address);
    await revokeRoleIfPresent(crowdsale, crowdsaleAdminRole, deployer.address);
  }

  console.log("\n3️⃣ Platform Manager roles");
  const managerAdminRole = await manager.DEFAULT_ADMIN_ROLE();
  const managerOperatorRole = await manager.OPERATOR_ROLE();
  await ensureRole(manager, managerAdminRole, adminSafe, "Admin Safe");
  await ensureRole(manager, managerOperatorRole, opsWallet, "Ops Wallet");
  if (deployer.address.toLowerCase() !== adminSafe.toLowerCase()) {
    await revokeRoleIfPresent(manager, managerOperatorRole, deployer.address);
    await revokeRoleIfPresent(manager, managerAdminRole, deployer.address);
  }

  console.log("\n4️⃣ Ownable handoff");
  const distributorCurrentOwner = await distributor.owner();
  await transferOwnershipIfNeeded(distributor, distributorCurrentOwner, distributorOwner, "Distributor");

  const vestingCurrentOwner = await vestingVault.owner();
  await transferOwnershipIfNeeded(vestingVault, vestingCurrentOwner, vestingOwner, "Vesting Vault");

  console.log("\n✅ Handoff complete.");
  console.log("Next: verify in Safe and wallet dashboards that the final model is active:");
  console.log("   - Admin Safe: governance / crowdsale admin / manager admin / token admin");
  console.log("   - Treasury Safe: treasury custody / distributor owner / recycle treasury");
  console.log("   - Ops Wallet: crowdsale operator / manager operator / vesting owner");
  console.log("   - Pauser Wallet: fast pause wallet (and crowdsale admin due current contract limitation)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
