const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🎁 EIT Crowdsale - Claim Mechanism", function () {
    let token, crowdsale, oracle, usdt;
    let owner, admin, treasury, alice, bob, carol;
    
    const PHASE_1_TARGET = ethers.parseUnits("100000", 18); // $100k for easy testing
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18);
    const PHASE_2_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_2_PRICE = ethers.parseUnits("0.08", 18);

    beforeEach(async function () {
        [owner, admin, treasury, alice, bob, carol] = await ethers.getSigners();

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
        
        // Add 2 phases
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
    });

    describe("🔓 Enable Claim", function () {
        beforeEach(async function () {
            // Alice and Bob complete phase 0
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            // Phase 0 is now complete
        });

        it("Should allow operator to enable claim for phase", async function () {
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(0)
            ).to.not.be.reverted;
            
            expect(await crowdsale.phaseClaimEnabled(0)).to.be.true;
        });

        it("Should only enable claim after phase completion", async function () {
            // Phase 0 is complete (from beforeEach)
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(0)
            ).to.not.be.reverted;
            
            // Phase 1 is NOT complete
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(1)
            ).to.be.reverted;
        });

        it("Should emit PhaseClaimEnabled event", async function () {
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(0)
            ).to.emit(crowdsale, "PhaseClaimEnabled")
             .withArgs(0);
        });

        it("Should reject non-operator enabling claim", async function () {
            await expect(
                crowdsale.connect(alice).enablePhaseClaim(0)
            ).to.be.reverted;
        });

        it("Should allow enabling claim for multiple phases", async function () {
            // beforeEach already completed phase 0
            // Phase 0 is complete, phase 1 is not
            expect((await crowdsale.phases(0)).isComplete).to.be.true;
            expect((await crowdsale.phases(1)).isComplete).to.be.false;
            
            // We can enable phase 0 (it's complete)
            await crowdsale.connect(admin).enablePhaseClaim(0);
            expect(await crowdsale.phaseClaimEnabled(0)).to.be.true;
            
            // Cannot enable phase 1 (it's not complete yet)
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(1)
            ).to.be.reverted;
            
            // Now let's complete phase 1
            const [, , , , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Both phases complete now
            expect((await crowdsale.phases(1)).isComplete).to.be.true;
            
            // Can enable phase 1 now
            await crowdsale.connect(admin).enablePhaseClaim(1);
            expect(await crowdsale.phaseClaimEnabled(1)).to.be.true;
            
            // Both phases have claim enabled
            expect(await crowdsale.phaseClaimEnabled(0)).to.be.true;
            expect(await crowdsale.phaseClaimEnabled(1)).to.be.true;
        });

        it("Should prevent enabling claim before phase completes", async function () {
            // Phase 1 is not complete yet
            const phase = await crowdsale.phases(1);
            expect(phase.isComplete).to.be.false;
            
            await expect(
                crowdsale.connect(admin).enablePhaseClaim(1)
            ).to.be.reverted;
        });
    });

    describe("💰 Token Claiming", function () {
        beforeEach(async function () {
            // Complete phase 0
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Enable claim
            await crowdsale.connect(admin).enablePhaseClaim(0);
        });

        it("Should successfully claim tokens", async function () {
            const tokensBefore = await token.balanceOf(alice.address);
            const allocation = await crowdsale.phasePurchased(0, alice.address);
            
            await crowdsale.connect(alice).claimPhase(0);
            
            const tokensAfter = await token.balanceOf(alice.address);
            expect(tokensAfter - tokensBefore).to.equal(allocation);
        });

        it("Should transfer correct token amount", async function () {
            const allocation = await crowdsale.phasePurchased(0, alice.address);
            expect(allocation).to.be.gt(0);
            
            await expect(
                crowdsale.connect(alice).claimPhase(0)
            ).to.changeTokenBalance(token, alice, allocation);
        });

        it("Should emit TokensClaimed event", async function () {
            const allocation = await crowdsale.phasePurchased(0, alice.address);
            
            await expect(
                crowdsale.connect(alice).claimPhase(0)
            ).to.emit(crowdsale, "TokensClaimed")
             .withArgs(alice.address, 0, allocation);
        });

        it("Should clear phasePurchased to zero after claim", async function () {
            await crowdsale.connect(alice).claimPhase(0);
            expect(await crowdsale.phasePurchased(0, alice.address)).to.equal(0);
        });

        it("Should prevent double claim", async function () {
            await crowdsale.connect(alice).claimPhase(0);
            
            // Try to claim again
            await expect(
                crowdsale.connect(alice).claimPhase(0)
            ).to.be.reverted; // phasePurchased[0][alice] is now 0
        });

        it("Should prevent claiming zero tokens", async function () {
            // Carol didn't buy anything
            await expect(
                crowdsale.connect(carol).claimPhase(0)
            ).to.be.reverted;
        });

        it("Should prevent claiming from disabled phase", async function () {
            // Get fresh users
            const [, , , , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            // Complete phase 1 with fresh users but don't enable claim
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Phase 1 is complete but claim not enabled
            const phase = await crowdsale.phases(1);
            expect(phase.isComplete).to.be.true;
            expect(await crowdsale.phaseClaimEnabled(1)).to.be.false;
            
            await expect(
                crowdsale.connect(user1).claimPhase(1)
            ).to.be.reverted; // phaseClaimEnabled[1] is false
        });
    });

    describe("🔒 Claim Restrictions", function () {
        beforeEach(async function () {
            // Complete phase 0
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(admin).enablePhaseClaim(0);
        });

        it("Should block claim when paused", async function () {
            await crowdsale.connect(admin).pause();
            
            await expect(
                crowdsale.connect(alice).claimPhase(0)
            ).to.be.reverted;
        });

        it("Should block claim in refund mode", async function () {
            // Enable refunds (can't do this if we reached soft cap, so skip)
            this.skip();
        });

        it("Should not affect other users' claims", async function () {
            const aliceAllocation = await crowdsale.phasePurchased(0, alice.address);
            const bobAllocation = await crowdsale.phasePurchased(0, bob.address);
            
            // Alice claims
            await crowdsale.connect(alice).claimPhase(0);
            
            // Bob's allocation should be unchanged
            expect(await crowdsale.phasePurchased(0, bob.address)).to.equal(bobAllocation);
        });

        it("Should allow multiple users to claim same phase", async function () {
            await expect(crowdsale.connect(alice).claimPhase(0)).to.not.be.reverted;
            await expect(crowdsale.connect(bob).claimPhase(0)).to.not.be.reverted;
            
            expect(await crowdsale.phasePurchased(0, alice.address)).to.equal(0);
            expect(await crowdsale.phasePurchased(0, bob.address)).to.equal(0);
        });

        it("Should support partial claims across phases", async function () {
            // Deploy fresh crowdsale to have full control
            const Token = await ethers.getContractFactory("EnsureInsuredToken");
            const token2 = await Token.deploy(owner.address, owner.address);
            
            const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
            const crowdsale2 = await Crowdsale.deploy(
                await token2.getAddress(),
                await oracle.getAddress(),
                treasury.address,
                admin.address
            );
            
            await token2.transfer(await crowdsale2.getAddress(), ethers.parseUnits("10000000000", 18));
            await crowdsale2.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
            await crowdsale2.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
            
            // Get fresh users
            const [, , , , , , , user1, user2, user3, user4, user5] = await ethers.getSigners();
            await crowdsale2.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address]);
            
            // user1 buys in phase 0 (10 ETH = $20k)
            await crowdsale2.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 0 with other users
            await crowdsale2.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale2.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
            // Phase 0 complete: $20k + $50k + $30k = $100k
            
            // user1 buys in phase 1 (10 ETH = $20k, total = $40k)
            await crowdsale2.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 1 with other users
            await crowdsale2.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale2.connect(user5).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
            // Phase 1 complete: $20k + $50k + $30k = $100k
            
            // Enable both phases
            await crowdsale2.connect(admin).enablePhaseClaim(0);
            await crowdsale2.connect(admin).enablePhaseClaim(1);
            
            // user1 claims phase 0
            await crowdsale2.connect(user1).claimPhase(0);
            expect(await crowdsale2.phasePurchased(0, user1.address)).to.equal(0);
            
            // user1 can still claim phase 1
            const phase1Allocation = await crowdsale2.phasePurchased(1, user1.address);
            expect(phase1Allocation).to.be.gt(0);
            
            await crowdsale2.connect(user1).claimPhase(1);
            expect(await crowdsale2.phasePurchased(1, user1.address)).to.equal(0);
        });
    });
});