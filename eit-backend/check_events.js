const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend-config.json', 'utf8'));
    const abiRaw = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend/src/EITCrowdsale.json', 'utf8'));
    const abi = abiRaw.abi || abiRaw;
    
    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    console.log("Checking Events for Crowdsale at:", config.CROWDSALE);
    
    try {
        const blockNum = await provider.getBlockNumber();
        const fromBlock = blockNum - 5000 > 0 ? blockNum - 5000 : 0;
        console.log(`Querying from block ${fromBlock} to latest...`);
        const filter = contract.filters.TokensPurchased();
        const events = await contract.queryFilter(filter, fromBlock, 'latest');
        
        console.log(`Found ${events.length} TokensPurchased events.`);
        
        events.forEach((e, i) => {
            console.log(`Event ${i+1}:`);
            console.log(`  Purchaser: ${e.args[0]}`);
            console.log(`  Tokens: ${ethers.formatEther(e.args[3])}`);
        });

    } catch (e) {
        console.error("Error fetching events:", e);
    }
}

main();
