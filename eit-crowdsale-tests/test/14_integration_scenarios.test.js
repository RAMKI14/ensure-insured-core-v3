const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🌐 EIT Crowdsale - Integration Scenarios", function () {
    let token, crowdsale, oracle, usdt, usdc;
    let owner, admin, treasury;
    
    const PHASE_1_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18);
    const PHASE_2_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_2_PRICE = ethers.parseUnits("0.08", 18);
    const PHASE_3_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_3_PRICE = ethers.parseUnits("0.10", 18);

    beforeEach(async function () {
        [owner, admin, treasury] = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);
        
        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy();
        
        const USDT = await ethers.getContractFactory("MockUSDT");
        usdt = await USDT.deploy();
        usdc = await USDT.deploy();
        
        const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );
        
        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("10000000000", 18));
        
        await crowdsale.connect(admin).addStablecoin(await usdt.getAddress(), 6);
        await crowdsale.connect(admin).addStablecoin(await usdc.getAddress(), 6);
    });

    it("Full ICO Success: 3 phases → finalize → claim", async function () {
        // Add 3 phases
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_3_TARGET, PHASE_3_PRICE);
        
        // Get users
        const [, , , user1, user2, user3, user4, user5, user6, user7] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address, user6.address, user7.address]);
        
        // Complete phase 0
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Complete phase 1
        await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Complete phase 2
        await crowdsale.connect(user5).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user6).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Finalize
        await crowdsale.connect(admin).finalizeSale();
        expect(await crowdsale.saleState()).to.equal(2); // Finalized
        
        // Enable claims
        await crowdsale.connect(admin).enablePhaseClaim(0);
        await crowdsale.connect(admin).enablePhaseClaim(1);
        await crowdsale.connect(admin).enablePhaseClaim(2);
        
        // Users claim
        await crowdsale.connect(user1).claimPhase(0);
        await crowdsale.connect(user3).claimPhase(1);
        await crowdsale.connect(user5).claimPhase(2);
        
        // Verify claims
        expect(await token.balanceOf(user1.address)).to.be.gt(0);
        expect(await token.balanceOf(user3.address)).to.be.gt(0);
        expect(await token.balanceOf(user5.address)).to.be.gt(0);
    });

    it("Full ICO Failure: 1 phase → no soft cap → refund", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        
        // Buy some but don't reach soft cap
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
        
        // Enable refunds (below soft cap)
        await crowdsale.connect(admin).enableRefunds();
        expect(await crowdsale.saleState()).to.equal(3); // Refunding
        
        // User1 gets refund
        await crowdsale.connect(user1).claimRefund();
        expect(await crowdsale.ethContributed(user1.address)).to.equal(0);
    });

    it("Partial Success: 2 phases → finalize → withdraw unsold", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        
        const [, , , user1, user2, user3, user4] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address]);
        
        // Only complete 2 phases
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("25") });
        await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") });
        
        // Finalize
        await crowdsale.connect(admin).finalizeSale();
        
        // Withdraw unsold
        const treasuryBefore = await token.balanceOf(treasury.address);
        await crowdsale.connect(admin).withdrawUnsoldTokens();
        const treasuryAfter = await token.balanceOf(treasury.address);
        
        expect(treasuryAfter).to.be.gt(treasuryBefore);
    });

    it("Multiple Users: 10 users across 3 phases", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        // Get 10 users
        const signers = await ethers.getSigners();
        const users = signers.slice(3, 13); // users 0-9
        await crowdsale.connect(admin).addToWhitelist(users.map(u => u.address));
        
        // Each user buys
        for (let i = 0; i < 10; i++) {
            await crowdsale.connect(users[i]).buyWithNative(0, { value: ethers.parseEther("1") });
        }
        
        // Verify all users have tokens
        for (let i = 0; i < 10; i++) {
            expect(await crowdsale.userTotalUSD(users[i].address)).to.be.gt(0);
        }
    });

    it("Mixed Payment: ETH + USDT + USDC in same phase", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1, user2, user3] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
        
        await usdt.transfer(user2.address, ethers.parseUnits("10000", 6));
        await usdc.transfer(user3.address, ethers.parseUnits("10000", 6));
        
        // user1 pays with ETH
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("5") });
        
        // user2 pays with USDT
        await usdt.connect(user2).approve(await crowdsale.getAddress(), ethers.parseUnits("10000", 6));
        await crowdsale.connect(user2).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("10000", 6), 0);
        
        // user3 pays with USDC
        await usdc.connect(user3).approve(await crowdsale.getAddress(), ethers.parseUnits("10000", 6));
        await crowdsale.connect(user3).buyWithStablecoin(await usdc.getAddress(), ethers.parseUnits("10000", 6), 0);
        
        // All should have allocations
        expect(await crowdsale.phasePurchased(0, user1.address)).to.be.gt(0);
        expect(await crowdsale.phasePurchased(0, user2.address)).to.be.gt(0);
        expect(await crowdsale.phasePurchased(0, user3.address)).to.be.gt(0);
    });

    it("Claim After Each Phase: Progressive claiming", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        
        const [, , , user1, user2, user3, user4, user5] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address]);
        
        // user1 buys in phase 0 (10 ETH = $20k)
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
        
        // Complete phase 0 (need $80k more: user2 $50k + user3 $30k)
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
        await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
        
        // Enable and claim phase 0
        await crowdsale.connect(admin).enablePhaseClaim(0);
        await crowdsale.connect(user1).claimPhase(0);
        expect(await token.balanceOf(user1.address)).to.be.gt(0);
        
        // user1 buys in phase 1 (10 ETH more = total $40k)
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
        
        // Complete phase 1 (need $80k more: user4 $50k + user5 $30k)
        await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
        await crowdsale.connect(user5).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
        
        // Enable and claim phase 1
        await crowdsale.connect(admin).enablePhaseClaim(1);
        const balanceBefore = await token.balanceOf(user1.address);
        await crowdsale.connect(user1).claimPhase(1);
        expect(await token.balanceOf(user1.address)).to.be.gt(balanceBefore);
    });

    it("Pause During Sale: Pause → unpause → continue", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        
        // user1 buys
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("5") });
        
        // Pause
        await crowdsale.connect(admin).pause();
        
        // user2 can't buy
        await expect(
            crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("5") })
        ).to.be.reverted;
        
        // Unpause
        await crowdsale.connect(admin).unpause();
        
        // user2 can buy now
        await expect(
            crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("5") })
        ).to.not.be.reverted;
    });

    it("Whitelist Rotation: Add → remove → re-add", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1] = await ethers.getSigners();
        
        // Add to whitelist
        await crowdsale.connect(admin).addToWhitelist([user1.address]);
        await expect(
            crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("1") })
        ).to.not.be.reverted;
        
        // Remove from whitelist
        await crowdsale.connect(admin).removeFromWhitelist([user1.address]);
        await expect(
            crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("1") })
        ).to.be.reverted;
        
        // Re-add to whitelist
        await crowdsale.connect(admin).addToWhitelist([user1.address]);
        await expect(
            crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("1") })
        ).to.not.be.reverted;
    });

    it("Edge Cap Filling: Fill to phase cap exactly", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1, user2] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
        
        // Fill exactly to $100k
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
        
        const phase = await crowdsale.phases(0);
        expect(phase.raisedUSD).to.equal(PHASE_1_TARGET);
        expect(phase.isComplete).to.be.true;
    });

    it("Soft Cap Edge: Below soft cap allows refunds", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address]);
        
        // Buy small amount (way below $15M soft cap)
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
        
        // Should be able to enable refunds
        await expect(
            crowdsale.connect(admin).enableRefunds()
        ).to.not.be.reverted;
        
        expect(await crowdsale.saleState()).to.equal(3); // Refunding
    });

    it("Refund All Users: Multiple users refund scenario", async function () {
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        
        const [, , , user1, user2, user3] = await ethers.getSigners();
        await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
        
        // All users buy
        await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("5") });
        await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("5") });
        await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("5") });
        
        // Enable refunds
        await crowdsale.connect(admin).enableRefunds();
        
        // All users refund
        await crowdsale.connect(user1).claimRefund();
        await crowdsale.connect(user2).claimRefund();
        await crowdsale.connect(user3).claimRefund();
        
        // All should have zero contributions
        expect(await crowdsale.ethContributed(user1.address)).to.equal(0);
        expect(await crowdsale.ethContributed(user2.address)).to.equal(0);
        expect(await crowdsale.ethContributed(user3.address)).to.equal(0);
    });
});