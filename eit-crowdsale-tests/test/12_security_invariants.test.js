const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🛡️ EIT Crowdsale - Security Invariants", function () {
    let token, crowdsale, oracle, usdt;
    let owner, admin, treasury, alice, bob, carol;
    
    const PHASE_1_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18);
    const PHASE_2_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_2_PRICE = ethers.parseUnits("0.08", 18);

    beforeEach(async function () {
        [owner, admin, treasury, alice, bob, carol] = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);
        
        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy();
        
        const USDT = await ethers.getContractFactory("MockUSDT");
        usdt = await USDT.deploy();
        
        const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );
        
        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("10000000000", 18));
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
        
        await crowdsale.connect(admin).addStablecoin(await usdt.getAddress(), 6);
        await usdt.transfer(alice.address, ethers.parseUnits("100000", 6));
    });

    describe("💎 Invariant 1: Token Balance", function () {
        it("Should maintain: balance >= totalTokensSold (always)", async function () {
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            expect(balance).to.be.gte(sold);
        });

        it("Should hold after purchase", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            expect(balance).to.be.gte(sold);
        });

        it("Should hold after claim", async function () {
            const [, , , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            // Complete phase and claim
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(admin).enablePhaseClaim(0);
            await crowdsale.connect(user1).claimPhase(0);
            
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            expect(balance).to.be.gte(sold);
        });

        it("Should hold after multiple users", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("5") });
            await crowdsale.connect(carol).buyWithNative(0, { value: ethers.parseEther("5") });
            
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            expect(balance).to.be.gte(sold);
        });

        it("Should hold after phase completion", async function () {
            const [, , , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            expect(balance).to.be.gte(sold);
        });
    });

    describe("💰 Invariant 2: Hard Cap", function () {
        it("Should maintain: totalRaisedUSD <= HARD_CAP", async function () {
            const raised = await crowdsale.totalRaisedUSD();
            const hardCap = await crowdsale.HARD_CAP();
            expect(raised).to.be.lte(hardCap);
        });

        it("Should hold for single large purchase", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") });
            
            const raised = await crowdsale.totalRaisedUSD();
            const hardCap = await crowdsale.HARD_CAP();
            expect(raised).to.be.lte(hardCap);
        });

        it("Should hold for multiple small purchases", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("1") });
            await crowdsale.connect(carol).buyWithNative(0, { value: ethers.parseEther("1") });
            
            const raised = await crowdsale.totalRaisedUSD();
            const hardCap = await crowdsale.HARD_CAP();
            expect(raised).to.be.lte(hardCap);
        });

        it("Should hold across phases", async function () {
            const [, , , , , , user1, user2, user3, user4] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address]);
            
            // Buy in phase 0
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 0
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") });
            
            // Buy in phase 1
            await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const raised = await crowdsale.totalRaisedUSD();
            const hardCap = await crowdsale.HARD_CAP();
            expect(raised).to.be.lte(hardCap);
        });
    });

    describe("📊 Invariant 3: Phase Accounting", function () {
        it("Should maintain: sum(phase.raisedUSD) == totalRaisedUSD", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const phase0 = await crowdsale.phases(0);
            const totalRaised = await crowdsale.totalRaisedUSD();
            
            expect(phase0.raisedUSD).to.equal(totalRaised);
        });

        it("Should hold across 2 phases", async function () {
            const [, , , , , , user1, user2, user3] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
            
            // Buy in phase 0
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 0
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") });
            
            // Buy in phase 1
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            
            const phase0 = await crowdsale.phases(0);
            const phase1 = await crowdsale.phases(1);
            const totalRaised = await crowdsale.totalRaisedUSD();
            
            expect(phase0.raisedUSD + phase1.raisedUSD).to.equal(totalRaised);
        });

        it("Should hold after partial phases", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("3") });
            
            const phase0 = await crowdsale.phases(0);
            const totalRaised = await crowdsale.totalRaisedUSD();
            
            expect(phase0.raisedUSD).to.equal(totalRaised);
        });
    });

    describe("👤 Invariant 4: User Cap", function () {
        it("Should maintain: userTotalUSD <= MAX_CONTRIBUTION", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const userTotal = await crowdsale.userTotalUSD(alice.address);
            const maxContribution = await crowdsale.MAX_CONTRIBUTION();
            
            expect(userTotal).to.be.lte(maxContribution);
        });

        it("Should hold for multiple purchases", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            
            const userTotal = await crowdsale.userTotalUSD(alice.address);
            const maxContribution = await crowdsale.MAX_CONTRIBUTION();
            
            expect(userTotal).to.be.lte(maxContribution);
        });

        it("Should hold across phases", async function () {
            const [, , , , , , user1, user2, user3] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
            
            // user1 buys in phase 0
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 0
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") });
            
            // user1 buys in phase 1
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const userTotal = await crowdsale.userTotalUSD(user1.address);
            const maxContribution = await crowdsale.MAX_CONTRIBUTION();
            
            expect(userTotal).to.be.lte(maxContribution);
        });
    });
});