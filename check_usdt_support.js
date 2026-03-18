const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    const config = JSON.parse(fs.readFileSync("./frontend-config.json", "utf8"));
    const abi = JSON.parse(fs.readFileSync("./frontend/src/EITCrowdsale.json", "utf8")).abi;
    
    // Public Sepolia RPC
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    console.log("Checking Crowdsale at:", config.CROWDSALE);
    console.log("Checking USDT:", config.USDT);
    
    const isSupported = await contract.supportedStable(config.USDT);
    const decimals = await contract.stablecoinDecimals(config.USDT);

    console.log("------------------------------------------");
    console.log(`USDT Supported: ${isSupported}`);
    console.log(`USDT Decimals: ${decimals}`);
    console.log("------------------------------------------");
}

main().catch(console.error);
