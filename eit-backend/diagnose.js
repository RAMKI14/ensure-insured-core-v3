const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    const config = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json', 'utf8'));
    const abi = JSON.parse(fs.readFileSync('/Users/ramki/Desktop/eit-final-v2/frontend/src/EITCrowdsale.json', 'utf8')).abi;
    
    const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const contract = new ethers.Contract(config.CROWDSALE, abi, provider);
    
    console.log("Checking Crowdsale at:", config.CROWDSALE);
    
    try {
        const saleState = await contract.saleState();
        const whitelistEnabled = await contract.whitelistEnabled();
        const currentPhase = await contract.currentPhase();
        const phaseCount = await contract.getPhaseCount();
        const totalRaised = await contract.totalRaisedUSD();
        const hardCap = await contract.HARD_CAP();
        const softCap = await contract.SOFT_CAP();
        const maxContribution = await contract.MAX_CONTRIBUTION();
        
        console.log("--- Contract State ---");
        console.log("Sale State:", ["Active", "SoftCapReached", "Finalized", "Refunding"][Number(saleState)]);
        console.log("Whitelist Enabled:", whitelistEnabled);
        console.log("Current Phase:", Number(currentPhase));
        console.log("Phase Count:", Number(phaseCount));
        console.log("Total Raised USD:", ethers.formatUnits(totalRaised, 18));
        console.log("Hard Cap:", ethers.formatUnits(hardCap, 18));
        console.log("Soft Cap:", ethers.formatUnits(softCap, 18));
        console.log("Max Contribution:", ethers.formatUnits(maxContribution, 18));

        const usdtAddress = config.USDT;
        const isSupported = await contract.supportedStable(usdtAddress);
        console.log(`USDT Support (${usdtAddress}):`, isSupported);

    } catch (e) {
        console.error("Error fetching state:", e);
    }
}

main();
