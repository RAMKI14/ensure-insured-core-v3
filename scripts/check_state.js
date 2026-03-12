const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const configPath = "./frontend-config.json";
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const CrowdsaleABI = require("../artifacts/contracts/EITCrowdsale.sol/EITCrowdsale.json");
    const crowdsale = await hre.ethers.getContractAt(CrowdsaleABI.abi, config.CROWDSALE);
    
    const totalRaised = await crowdsale.totalRaisedUSD();
    console.log("Total Raised USD:", hre.ethers.formatUnits(totalRaised, 18));
    
    const phaseCount = await crowdsale.getPhaseCount();
    console.log("Phase Count:", phaseCount.toString());
    
    if (phaseCount > 0) {
        const currentPhase = await crowdsale.currentPhase();
        console.log("Current Phase:", currentPhase.toString());
        const phase = await crowdsale.phases(currentPhase);
        console.log("Phase Raised:", hre.ethers.formatUnits(phase.raisedUSD, 18));
        console.log("Phase StartTime:", phase.startTime.toString());
        console.log("Phase EndTime:", phase.endTime.toString());
        if (phase.startTime > 0) {
            console.log("Readable StartTime:", new Date(Number(phase.startTime) * 1000).toLocaleString());
        }
    }
}
main().catch(console.error);
