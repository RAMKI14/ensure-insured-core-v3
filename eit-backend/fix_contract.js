const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend/src/EITCrowdsale.json', 'utf8')).abi;
    
    // Load Private Key
    const env = fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/.env', 'utf8');
    const privateKeyMatch = env.match(/PRIVATE_KEY=([a-f0-9]+)/i);
    if (!privateKeyMatch) throw new Error("Private key not found in .env");
    const privateKey = privateKeyMatch[1];

    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, wallet);
    
    console.log("Fixing Crowdsale at:", config.CROWDSALE);
    console.log("Adding USDT:", config.USDT);
    
    try {
        const tx = await contract.addStablecoin(config.USDT, 6);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ USDT successfully added as supported stablecoin!");
    } catch (e) {
        if (e.message.includes("execution reverted")) {
            console.log("⚠️ Transaction reverted. USDT might already be supported or you lack permissions.");
        } else {
            console.error("Error fixing contract:", e);
        }
    }
}

main();
