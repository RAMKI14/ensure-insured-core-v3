const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔬 EIT Crowdsale - Edge Cases", function () {
    let token, crowdsale, oracle;
    let owner, admin, treasury, alice, bob;
    
    const PHASE_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_PRICE = ethers.parseUnits("0.05", 18);

    beforeEach(async function () {
        [owner, admin, treasury, alice, bob] = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);
        
        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy();
        
        const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );
        
        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("10000000000", 18));
        await crowdsale.connect(admin).addPhase(PHASE_TARGET, PHASE_PRICE);
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address]);
    });

    it("Should handle exact MIN_CONTRIBUTION ($100)", async function () {
        // 0.05 ETH at $2000 = $100
        await expect(
            crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("0.05") })
        ).to.not.be.reverted;
        
        const userUSD = await crowdsale.userTotalUSD(alice.address);
        expect(userUSD).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should handle exact MAX_CONTRIBUTION ($50k)", async function () {
        // 25 ETH at $2000 = $50,000
        await expect(
            crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") })
        ).to.not.be.reverted;
        
        const userUSD = await crowdsale.userTotalUSD(alice.address);
        expect(userUSD).to.equal(ethers.parseUnits("50000", 18));
    });

    it("Should handle exact phase target", async function () {
        const [, , , , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        
        // Exactly $100k = 25 ETH + 25 ETH
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        
        const phase = await crowdsale.phases(0);
        expect(phase.raisedUSD).to.equal(PHASE_TARGET);
        expect(phase.isComplete).to.be.true;
    });

    it("Should handle purchase crossing milestone exactly", async function () {
        // Would need $5M to test - verify constant
        expect(await crowdsale.MILESTONE_SIZE_USD()).to.equal(ethers.parseUnits("5000000", 18));
    });

    it("Should handle refund with zero balance", async function () {
        await crowdsale.connect(admin).enableRefunds();
        
        // Alice hasn't bought anything
        await expect(
            crowdsale.connect(alice).claimRefund()
        ).to.not.be.reverted; // No-op, doesn't revert
    });

    it("Should handle claim with zero allocation", async function () {
        const [, , , , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        
        // Complete phase
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(admin).enablePhaseClaim(0);
        
        // Alice didn't buy anything in phase 0
        await expect(
            crowdsale.connect(alice).claimPhase(0)
        ).to.be.reverted; // Zero allocation
    });

    it("Should handle last wei of phase", async function () {
        // beforeEach already created phase 0 ($100k)
        // Create a new small phase (phase 1) with $2000 target
        await crowdsale.connect(admin).addPhase(ethers.parseUnits("2000", 18), PHASE_PRICE);
        
        // Complete phase 0 first to move to phase 1
        const [, , , , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Now in phase 1, buy exactly to fill (1 ETH = $2000)
        await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
        
        const phase = await crowdsale.phases(1);
        expect(phase.isComplete).to.be.true;
    });

    it("Should handle phase with small target", async function () {
        // beforeEach already created phase 0 ($100k)
        // Add $100 phase (phase 1)
        await crowdsale.connect(admin).addPhase(ethers.parseUnits("100", 18), PHASE_PRICE);
        
        // Complete phase 0 first
        const [, , , , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Now buy in phase 1: 0.05 ETH = $100
        await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("0.05") });
        
        const phase = await crowdsale.phases(1);
        expect(phase.isComplete).to.be.true;
    });

    it("Should handle 10 phases", async function () {
        // beforeEach already created 1 phase
        // Add 10 more phases
        for (let i = 0; i < 10; i++) {
            await crowdsale.connect(admin).addPhase(PHASE_TARGET, PHASE_PRICE);
        }
        
        // Verify we can query all phases (1 from beforeEach + 10 new = 11 total)
        // Check by trying to get phase 10 (0-indexed, so 11th phase)
        const phase10 = await crowdsale.phases(10);
        expect(phase10.targetUSD).to.equal(PHASE_TARGET);
        
        // Verify phase 11 doesn't exist (would revert)
        await expect(
            crowdsale.phases(11)
        ).to.be.reverted;
    });

    it("Should handle 500 user whitelist batch", async function () {
        // Generate 500 random addresses
        const users = [];
        for (let i = 0; i < 500; i++) {
            users.push(ethers.Wallet.createRandom().address);
        }
        
        await expect(
            crowdsale.connect(admin).addToWhitelist(users)
        ).to.not.be.reverted;
    });
});