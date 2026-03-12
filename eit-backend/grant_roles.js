const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '/Users/ramki/Desktop/eit-final-v2/.env' });

async function main() {
    const config = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-admin-v2/src/EITCrowdsale.json', 'utf8')).abi;
    
    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const pk = process.env.PRIVATE_KEY;
    const wallet = new ethers.Wallet(pk, provider);
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, wallet);
    
    const userAddress = "0xC40FCe8b75dfC6dbe140Ed2CEAc6A521Ab6c1383"; 
    
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
    
    console.log(`Using Deployer Wallet: ${wallet.address}`);
    console.log(`Granting roles to: ${userAddress}`);
    
    try {
        console.log("Granting DEFAULT_ADMIN_ROLE...");
        const tx1 = await contract.grantRole(DEFAULT_ADMIN_ROLE, userAddress);
        await tx1.wait();
        console.log("✅ Granted DEFAULT_ADMIN_ROLE");
        
        console.log("Granting OPERATOR_ROLE...");
        const tx2 = await contract.grantRole(OPERATOR_ROLE, userAddress);
        await tx2.wait();
        console.log("✅ Granted OPERATOR_ROLE");

    } catch (e) {
        console.error("Error granting roles:", e);
    }
}

main();
