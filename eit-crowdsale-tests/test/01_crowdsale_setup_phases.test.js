const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🏗️ EIT Crowdsale - Setup & Phase Management", function () {
    let token, crowdsale, oracle, usdt;
    let owner, admin, operator, treasury, alice, bob, carol;
    
    const PHASE_1_TARGET = ethers.parseUnits("5000000", 18); // $5M
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18); // $0.05
    const PHASE_2_TARGET = ethers.parseUnits("5000000", 18);
    const PHASE_2_PRICE = ethers.parseUnits("0.08", 18);

    beforeEach(async function () {
        [owner, admin, operator, treasury, alice, bob, carol] = await ethers.getSigners();

        // Deploy Token
        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);

        // Deploy Mock Oracle (returns $2000 ETH)
        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy();

        // Deploy Mock USDT
        const USDT = await ethers.getContractFactory("MockUSDT");
        usdt = await USDT.deploy();

        // Deploy Crowdsale
        const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );

        // Transfer tokens to crowdsale
        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("1000000000", 18)); // 1B tokens
    });

    describe("📦 Deployment", function () {
        it("Should set correct initial state", async function () {
            expect(await crowdsale.saleState()).to.equal(0); // Active
            expect(await crowdsale.treasury()).to.equal(treasury.address);
            expect(await crowdsale.totalRaisedUSD()).to.equal(0);
            expect(await crowdsale.totalTokensSold()).to.equal(0);
            expect(await crowdsale.currentPhase()).to.equal(0);
        });

        it("Should set correct constants", async function () {
            expect(await crowdsale.HARD_CAP()).to.equal(ethers.parseUnits("100000000", 18));
            expect(await crowdsale.SOFT_CAP()).to.equal(ethers.parseUnits("15000000", 18));
            expect(await crowdsale.MIN_CONTRIBUTION()).to.equal(ethers.parseUnits("100", 18));
            expect(await crowdsale.MAX_CONTRIBUTION()).to.equal(ethers.parseUnits("50000", 18));
        });

        it("Should grant admin roles correctly", async function () {
            const DEFAULT_ADMIN = await crowdsale.DEFAULT_ADMIN_ROLE();
            const OPERATOR_ROLE = await crowdsale.OPERATOR_ROLE();
            
            expect(await crowdsale.hasRole(DEFAULT_ADMIN, admin.address)).to.be.true;
            expect(await crowdsale.hasRole(OPERATOR_ROLE, admin.address)).to.be.true;
        });

        it("Should reject direct ETH sends", async function () {
            await expect(
                owner.sendTransaction({
                    to: await crowdsale.getAddress(),
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWith("Use buyWithNative()");
        });
    });

    describe("📊 Phase Management", function () {
        it("Should allow admin to add phase", async function () {
            await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
            
            expect(await crowdsale.getPhaseCount()).to.equal(1);
            
            const phase = await crowdsale.phases(0);
            expect(phase.targetUSD).to.equal(PHASE_1_TARGET);
            expect(phase.priceUSD).to.equal(PHASE_1_PRICE);
            expect(phase.raisedUSD).to.equal(0);
            expect(phase.isComplete).to.be.false;
        });

        it("Should allow adding multiple phases", async function () {
            await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
            await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
            
            expect(await crowdsale.getPhaseCount()).to.equal(2);
        });

        it("Should reject non-admin adding phase", async function () {
            await expect(
                crowdsale.connect(alice).addPhase(PHASE_1_TARGET, PHASE_1_PRICE)
            ).to.be.reverted;
        });

        it("Should reject adding phase after finalization", async function () {
            await crowdsale.connect(admin).finalizeSale();
            
            await expect(
                crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE)
            ).to.be.reverted;
        });

        it("Should store phase data correctly", async function () {
            await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
            
            const phase = await crowdsale.phases(0);
            expect(phase.targetUSD).to.equal(PHASE_1_TARGET);
            expect(phase.priceUSD).to.equal(PHASE_1_PRICE);
            expect(phase.raisedUSD).to.equal(0);
            expect(phase.isComplete).to.be.false;
        });

        it("Should return correct phase count", async function () {
            expect(await crowdsale.getPhaseCount()).to.equal(0);
            
            await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
            expect(await crowdsale.getPhaseCount()).to.equal(1);
            
            await crowdsale.connect(admin).addPhase(PHASE_2_TARGET, PHASE_2_PRICE);
            expect(await crowdsale.getPhaseCount()).to.equal(2);
        });

        it("Should reject purchase if no phases exist", async function () {
            // Add alice to whitelist
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
        });

        it("Should handle phase completion correctly", async function () {
            // Use smaller phase for testing: $100k instead of $5M
            await crowdsale.connect(admin).addPhase(
                ethers.parseUnits("100000", 18), // $100k
                PHASE_1_PRICE
            );
            await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address]);
            
            // Fill phase: $100k / $2000 per ETH = 50 ETH
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            
            await expect(
                crowdsale.connect(bob).buyWithNative(0, { value: ethers.parseEther("25") }) // $50k
            ).to.emit(crowdsale, "PhaseCompleted").withArgs(0);
            
            const phase = await crowdsale.phases(0);
            expect(phase.isComplete).to.be.true;
            expect(await crowdsale.currentPhase()).to.equal(1);
        });

        it("Should prevent buying completed phase", async function () {
            // Get fresh users that haven't bought anything yet
            const [, , , , , , , user1, user2, user3] = await ethers.getSigners();
            
            // Create small test phase
            await crowdsale.connect(admin).addPhase(
                ethers.parseUnits("100000", 18), // $100k
                PHASE_1_PRICE
            );
            
            // Whitelist fresh users
            await crowdsale.connect(admin).addToWhitelist([user1.address, user2.address, user3.address]);
            
            // Fill phase completely with fresh users: $50k + $50k = $100k
            await crowdsale.connect(user1).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            await crowdsale.connect(user2).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            
            // Verify phase is actually complete
            const phase = await crowdsale.phases(0);
            expect(phase.isComplete).to.be.true;
            expect(await crowdsale.currentPhase()).to.equal(1);
            
            // Try to buy with user3 (fresh user) - should fail because no phase 1 exists
            await expect(
                crowdsale.connect(user3).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
        });

        it("Should prevent overfilling phase", async function () {
            await crowdsale.connect(admin).addPhase(ethers.parseUnits("100", 18), PHASE_1_PRICE); // Only $100 target
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            
            // Try to buy $200 worth when phase only has $100 capacity
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("0.1") }) // 0.1 ETH * $2000 = $200
            ).to.be.reverted;
        });
    });

    describe("🔒 Access Control", function () {
        it("Should only allow admin to add phases", async function () {
            await expect(
                crowdsale.connect(alice).addPhase(PHASE_1_TARGET, PHASE_1_PRICE)
            ).to.be.reverted;
            
            await expect(
                crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE)
            ).to.not.be.reverted;
        });

        it("Should only allow admin to pause", async function () {
            await expect(crowdsale.connect(alice).pause()).to.be.reverted;
            await expect(crowdsale.connect(admin).pause()).to.not.be.reverted;
        });

        it("Should only allow admin to finalize", async function () {
            await expect(crowdsale.connect(alice).finalizeSale()).to.be.reverted;
            await expect(crowdsale.connect(admin).finalizeSale()).to.not.be.reverted;
        });
    });
});