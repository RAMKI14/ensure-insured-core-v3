const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🚨 EIT Crowdsale - Deep Dive Treasury Verification", function () {
    let token, crowdsale, oracle, usdt;
    let owner, admin, treasury, whale;
    
    const MILESTONE = ethers.parseUnits("1000000", 18); 

    beforeEach(async function () {
        [owner, admin, treasury, whale] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);

        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy(); 

        const USDT = await ethers.getContractFactory("MockUSDT");
        usdt = await USDT.deploy();

        // Use TestCrowdsale which has MAX_CONTRIBUTION = 100M
        const Crowdsale = await ethers.getContractFactory("TestCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );

        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("1000000000", 18));
        await crowdsale.connect(admin).addPhase(ethers.parseUnits("100000000", 18), ethers.parseUnits("0.05", 18));
        await crowdsale.connect(admin).addToWhitelist([whale.address]);
        await crowdsale.connect(admin).addStablecoin(await usdt.getAddress(), 6);
        await usdt.transfer(whale.address, ethers.parseUnits("10000000", 6));
    });

    describe("🌊 Multi-Milestone Whale Purchase", function () {
        it("PROVE: While loop handles $3M jump correctly in ONE transaction", async function () {
            // Scenario: 
            // 1. Initial State: Total Raised = $900k
            // 2. Whale buys $2.3M in one tx.
            // 3. Total Raised = $3.2M.
            // 4. Verification: 3 milestones hit, $3M Released to treasury.
            
            // Step 1: Raise to $900k
            await usdt.connect(whale).approve(await crowdsale.getAddress(), ethers.parseUnits("900000", 6));
            await crowdsale.connect(whale).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("900000", 6), 0n);

            expect(await crowdsale.totalRaisedUSD()).to.equal(ethers.parseUnits("900000", 18));
            expect(await crowdsale.totalReleasedUSD()).to.equal(0n);

            // Step 2: WHALE BUYS $2.3M in one transaction
            const treasuryBefore = await usdt.balanceOf(treasury.address);
            
            await usdt.connect(whale).approve(await crowdsale.getAddress(), ethers.parseUnits("2300000", 6));
            
            // Execute Whale Tx
            const tx = await crowdsale.connect(whale).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("2300000", 6), 0n);
            const receipt = await tx.wait();

            // Step 3: VERIFY Logic
            // Total should be $3.2M
            expect(await crowdsale.totalRaisedUSD()).to.equal(ethers.parseUnits("3200000", 18));
            
            // totalReleasedUSD should be exactly $3,000,000 (3 milestones tracked)
            // Even though we sweep $3.2M, the "accounting milestones" are in $1M chunks.
            expect(await crowdsale.totalReleasedUSD()).to.equal(ethers.parseUnits("3000000", 18));

            // Treasury should have received EVERYTHING ($3,200,000) because our logic is a "Sweep-All"
            const treasuryAfter = await usdt.balanceOf(treasury.address);
            expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseUnits("3200000", 6));

            // Contract should be EMPTY (0 stuck funds)
            expect(await usdt.balanceOf(await crowdsale.getAddress())).to.equal(0n);

            console.log("   ✅ Verified: While loop correctly processed 3 milestones in a single whale transaction.");
        });

        it("PROVE: Proportional / Mixed Currency Sweep", async function () {
            // 1. User pays with ETH ($600k)
            // 2. User pays with USDT ($399.9k)
            // Total = $999.9k. Funds still in contract.
            
            const ethAmount = ethers.parseEther("300"); // 300 * $2000 = $600,000
            await crowdsale.connect(whale).buyWithNative(0n, { value: ethAmount });

            await usdt.connect(whale).approve(await crowdsale.getAddress(), ethers.parseUnits("399900", 6));
            await crowdsale.connect(whale).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("399900", 6), 0n);

            expect(await ethers.provider.getBalance(await crowdsale.getAddress())).to.equal(ethAmount);
            expect(await usdt.balanceOf(await crowdsale.getAddress())).to.equal(ethers.parseUnits("399900", 6));

            // 3. User buys $200 worth of USDT. Total crosses $1,000,000.
            const treasuryEthBefore = await ethers.provider.getBalance(treasury.address);
            const treasuryUsdtBefore = await usdt.balanceOf(treasury.address);

            await usdt.connect(whale).approve(await crowdsale.getAddress(), ethers.parseUnits("200", 6));
            await crowdsale.connect(whale).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("200", 6), 0n);

            // 4. VERIFY: Contract swept BOTH currencies!
            expect(await ethers.provider.getBalance(await crowdsale.getAddress())).to.equal(0n);
            expect(await usdt.balanceOf(await crowdsale.getAddress())).to.equal(0n);

            const treasuryEthAfter = await ethers.provider.getBalance(treasury.address);
            const treasuryUsdtAfter = await usdt.balanceOf(treasury.address);

            expect(treasuryEthAfter > treasuryEthBefore).to.be.true;
            expect(treasuryUsdtAfter > treasuryUsdtBefore).to.be.true;
            
            console.log("   ✅ Verified: ETH and USDT swept proportionally in the same milestone.");
        });
    });
});
