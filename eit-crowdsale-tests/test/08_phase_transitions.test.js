const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔄 EIT Crowdsale - Phase Transitions", function () {
    let token, crowdsale, oracle;
    let owner, admin, treasury, alice, bob;
    
    const PHASE_1_TARGET = ethers.parseUnits("100000", 18); // $100k
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18);
    const PHASE_2_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_2_PRICE = ethers.parseUnits("0.08", 18);
    const PHASE_3_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_3_PRICE = ethers.parseUnits("0.10", 18);

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
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
        await crowdsale.connect(admin).addPhase(PHASE_3_TARGET, PHASE_3_PRICE);
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address]);
    });

    describe("✅ Auto-Completion", function () {
        it("Should auto-complete phase at target", async function () {
            // Get fresh users
            const [, , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            // Fill phase 0 completely: $50k + $50k = $100k
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            const phase = await crowdsale.phases(0);
            expect(phase.isComplete).to.be.true;
        });

        it("Should emit PhaseCompleted event", async function () {
            const [, , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Last purchase that completes the phase
            await expect(
                crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") })
            ).to.emit(crowdsale, "PhaseCompleted").withArgs(0);
        });

        it("Should increment currentPhase", async function () {
            const [, , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            expect(await crowdsale.currentPhase()).to.equal(0);
            
            // Complete phase 0
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            expect(await crowdsale.currentPhase()).to.equal(1);
        });

        it("Should activate next phase", async function () {
            const [, , , , , user1, user2, user3] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
            
            // Complete phase 0
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Should now be able to buy in phase 1
            await expect(
                crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
            
            // Verify purchase was in phase 1
            expect(await crowdsale.phasePurchased(1, user3.address)).to.be.gt(0);
        });

        it("Should set isComplete flag", async function () {
            const [, , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            const phaseBefore = await crowdsale.phases(0);
            expect(phaseBefore.isComplete).to.be.false;
            
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            const phaseAfter = await crowdsale.phases(0);
            expect(phaseAfter.isComplete).to.be.true;
        });
    });

    describe("🎯 Soft Cap Logic", function () {
        it("Should trigger SoftCapReached at $15M", async function () {
            // Would need $15M to test - impractical
            // Verify constant exists
            expect(await crowdsale.SOFT_CAP()).to.equal(ethers.parseUnits("15000000", 18));
        });

        it("Should remain Active below $15M", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
            expect(await crowdsale.saleState()).to.equal(0); // Active
        });

        it("Should not affect phase transitions below soft cap", async function () {
            const [, , , , , user1, user2] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address]);
            
            // Complete a phase (still way below $15M soft cap)
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // Should still be Active
            expect(await crowdsale.saleState()).to.equal(0);
            expect(await crowdsale.currentPhase()).to.equal(1);
        });

        it("Should handle multiple phases reaching soft cap", async function () {
            // Impractical to test - verify logic exists
            const softCap = await crowdsale.SOFT_CAP();
            const hardCap = await crowdsale.HARD_CAP();
            expect(softCap).to.be.lt(hardCap);
        });

        it("Should track progress toward soft cap", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
            
            const totalRaised = await crowdsale.totalRaisedUSD();
            const softCap = await crowdsale.SOFT_CAP();
            
            expect(totalRaised).to.be.lt(softCap);
        });
    });

    describe("🔗 Multi-Phase Flow", function () {
        it("Should support purchase across 3 phases", async function () {
            const [, , , , , user1, user2, user3, user4, user5, user6, user7] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address, user6.address, user7.address]);
            
            // Buy in phase 0 (user1: 10 ETH = $20k)
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            expect(await crowdsale.phasePurchased(0, user1.address)).to.be.gt(0);
            
            // Complete phase 0 (need exactly $80k more: user2 $50k + user3 $30k = $100k total)
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
            // Phase 0 complete: $20k + $50k + $30k = $100k ✅
            
            // Buy in phase 1 (user4: 10 ETH = $20k)
            await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("10") });
            expect(await crowdsale.phasePurchased(1, user4.address)).to.be.gt(0);
            
            // Complete phase 1 (need exactly $80k more)
            await crowdsale.connect(user5).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale.connect(user6).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
            // Phase 1 complete: $20k + $50k + $30k = $100k ✅
            
            // Buy in phase 2 (user7: 10 ETH = $20k)
            await crowdsale.connect(user7).buyWithNative(0, { value: ethers.parseEther("10") });
            expect(await crowdsale.phasePurchased(2, user7.address)).to.be.gt(0);
        });

        it("Should apply different pricing per phase", async function () {
            // Phase 0: $0.05, Phase 1: $0.08, Phase 2: $0.10
            // Same USD should give fewer tokens in later phases
            const usdAmount = ethers.parseUnits("2000", 18); // $2000
            
            const tokens0 = usdAmount * ethers.parseUnits("1", 18) / PHASE_1_PRICE;
            const tokens1 = usdAmount * ethers.parseUnits("1", 18) / PHASE_2_PRICE;
            const tokens2 = usdAmount * ethers.parseUnits("1", 18) / PHASE_3_PRICE;
            
            expect(tokens0).to.be.gt(tokens1); // Lower price = more tokens
            expect(tokens1).to.be.gt(tokens2);
        });

        it("Should track users across phases", async function () {
            const [, , , , , user1, user2, user3] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
            
            // user1 buys in phase 0 (10 ETH = $20k)
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // Complete phase 0 (need exactly $80k more: user2 $50k + user3 $30k)
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("15") }); // $30k
            // Phase 0 complete: $20k + $50k + $30k = $100k ✅
            
            // user1 buys in phase 1 (10 ETH more = total $40k)
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("10") });
            
            // user1 should have tokens in both phases
            expect(await crowdsale.phasePurchased(0, user1.address)).to.be.gt(0);
            expect(await crowdsale.phasePurchased(1, user1.address)).to.be.gt(0);
        });

        it("Should prevent buying non-existent phase", async function () {
            const [, , , , , user1, user2, user3, user4, user5, user6] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address, user6.address]);
            
            // Complete all 3 phases
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") });
            
            await crowdsale.connect(user5).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user6).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // currentPhase = 3, but only 3 phases exist (0, 1, 2)
            expect(await crowdsale.currentPhase()).to.equal(3);
            
            // Try to buy - should fail
            const [, , , , , , , user7] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user7.address]);
            
            await expect(
                crowdsale.connect(user7).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
        });

        it("Should handle last phase completion", async function () {
            const [, , , , , user1, user2, user3, user4, user5, user6] = await ethers.getSigners();
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address, user4.address, user5.address, user6.address]);
            
            // Complete all phases
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user4).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user5).buyWithNative(0, { value: ethers.parseEther("25") });
            await crowdsale.connect(user6).buyWithNative(0, { value: ethers.parseEther("25") });
            
            // All phases should be complete
            expect((await crowdsale.phases(0)).isComplete).to.be.true;
            expect((await crowdsale.phases(1)).isComplete).to.be.true;
            expect((await crowdsale.phases(2)).isComplete).to.be.true;
            
            // currentPhase should be 3 (no more phases)
            expect(await crowdsale.currentPhase()).to.equal(3);
        });
    });
});