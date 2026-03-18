const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('./frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('./frontend/src/EITCrowdsale.json', 'utf8')).abi;
    
    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    console.log("Checking Crowdsale at:", config.CROWDSALE);
    
    try {
        const count = await contract.getPhaseCount();
        const totalRaised = await contract.totalRaisedUSD();
        const currentState = await contract.saleState();
        const currentPhaseIdx = await contract.currentPhase();
        
        console.log(`On-Chain Phase Count: ${count}`);
        console.log(`Current Phase Index: ${currentPhaseIdx}`);
        console.log(`Sale State: ${currentState} (0=Active, 1=SoftCapReached, 2=Finalized, 3=Refunding)`);
        console.log(`Total Raised USD: ${ethers.formatUnits(totalRaised, 18)}`);
        
        for (let i = 0; i < Number(count); i++) {
            const phase = await contract.phases(i);
            console.log(`Phase ${i}: Target=${ethers.formatUnits(phase.targetUSD, 18)} USD, Price=${ethers.formatUnits(phase.priceUSD, 18)} USD, Raised=${ethers.formatUnits(phase.raisedUSD, 18)} USD, Complete=${phase.isComplete}`);
        }
    } catch (e) {
        console.error("Error fetching phases:", e);
    }
}

main();
