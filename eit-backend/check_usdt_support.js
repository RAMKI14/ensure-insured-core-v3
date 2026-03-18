const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Relative paths from eit-backend/
    const configPath = path.join(__dirname, "frontend-config.json");
    const abiPath = path.join(__dirname, "../frontend/src/EITCrowdsale.json");

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const abi = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;
    
    // Public Sepolia RPC
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    console.log("Checking Crowdsale at:", config.CROWDSALE);
    console.log("Checking USDT:", config.USDT);
    
    try {
        const isSupported = await contract.supportedStable(config.USDT);
        const decimals = await contract.stablecoinDecimals(config.USDT);
        
        // Try to get owner if it exists (using AccessControl getRoleMember or similar)
        let owner = "Unknown";
        try {
            owner = await contract.getRoleMember(ethers.ZeroHash, 0); 
        } catch (e) {
            // Might not have getRoleMember if not using that variant of AccessControl
        }

        console.log("------------------------------------------");
        console.log(`USDT Supported: ${isSupported}`);
        console.log(`USDT Decimals: ${decimals}`);
        console.log(`Contract Admin: ${owner}`);
        console.log("------------------------------------------");
    } catch (err) {
        console.error("Contract query failed:", err.message);
    }
}

main().catch(console.error);
