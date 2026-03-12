const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-admin-v2/src/EITCrowdsale.json', 'utf8')).abi;
    
    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    // Address of the user (e.g., from the screenshot or typical test wallet)
    // In the screenshot, I see 0xC40F... which matched my earlier purchase check.
    const userAddress = "0xC40FCe8b75dfC6dbe140Ed2CEAc6A521Ab6c1383"; 
    
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
    
    try {
        const hasAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, userAddress);
        const hasOp = await contract.hasRole(OPERATOR_ROLE, userAddress);
        
        console.log(`Address: ${userAddress}`);
        console.log(`Has DEFAULT_ADMIN_ROLE: ${hasAdmin}`);
        console.log(`Has OPERATOR_ROLE: ${hasOp}`);
        
        // Also check who is the deployer (if we can infer it)
        // Usually the deployer is the one with the private key in .env
        const deployer = new ethers.Wallet(process.env.PRIVATE_KEY).address;
        console.log(`Deployer Address: ${deployer}`);
        const deployerHasAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer);
        console.log(`Deployer Has DEFAULT_ADMIN_ROLE: ${deployerHasAdmin}`);

    } catch (e) {
        console.error("Error checking roles:", e);
    }
}

main();
