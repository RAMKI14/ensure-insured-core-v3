const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('./frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('./frontend/src/EITCrowdsale.json', 'utf8')).abi;
    
    // Load Private Key
    const env = fs.readFileSync('./.env', 'utf8');
    const privateKeyMatch = env.match(/PRIVATE_KEY=([a-f0-9]+)/i);
    if (!privateKeyMatch) throw new Error("Private key not found in .env");
    const privateKey = privateKeyMatch[1];

    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, wallet);
    
    console.log("Initializing Crowdsale at:", config.CROWDSALE);
    
    // 1. Add Phase 1 (Seed Round)
    try {
        console.log("Adding Phase 1 (Seed Round)...");
        // targetUSD: 5M (with 18 decimals), priceUSD: 0.005 (with 18 decimals)
        const target = ethers.parseUnits("5000000", 18);
        const price = ethers.parseUnits("0.005", 18);
        const txPhase = await contract.addPhase(target, price);
        await txPhase.wait();
        console.log("✅ Phase 1 Added.");
    } catch (e) {
        console.error("Phase 1 Error:", e.message);
    }

    // 2. Add USDT Support
    try {
        console.log("Adding USDT Support:", config.USDT);
        const txUsdt = await contract.addStablecoin(config.USDT, 6);
        await txUsdt.wait();
        console.log("✅ USDT Support Added.");
    } catch (e) {
        console.error("USDT Error:", e.message);
    }

    // 3. Disable Whitelist (Open Sale Mode) - As requested by user earlier
    try {
        console.log("Disabling KYC (Open Sale Mode)...");
        const txKyc = await contract.setWhitelistEnabled(false);
        await txKyc.wait();
        console.log("✅ KYC Disabled.");
    } catch (e) {
        console.error("KYC Error:", e.message);
    }
}

main();
