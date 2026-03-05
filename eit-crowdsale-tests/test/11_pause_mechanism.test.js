const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("⏸️ EIT Crowdsale - Pause Mechanism", function () {
    let token, crowdsale, oracle;
    let owner, admin, treasury, alice;
    
    const PHASE_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_PRICE = ethers.parseUnits("0.05", 18);

    beforeEach(async function () {
        [owner, admin, treasury, alice] = await ethers.getSigners();
        
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
        await crowdsale.connect(admin).addToWhitelist([alice.address]);
    });

    describe("🔒 Pause Control", function () {
        it("Should allow admin to pause", async function () {
            await expect(
                crowdsale.connect(admin).pause()
            ).to.not.be.reverted;
            
            expect(await crowdsale.paused()).to.be.true;
        });

        it("Should allow admin to unpause", async function () {
            await crowdsale.connect(admin).pause();
            
            await expect(
                crowdsale.connect(admin).unpause()
            ).to.not.be.reverted;
            
            expect(await crowdsale.paused()).to.be.false;
        });

        it("Should reject non-admin pause", async function () {
            await expect(
                crowdsale.connect(alice).pause()
            ).to.be.reverted;
        });

        it("Should reject non-admin unpause", async function () {
            await crowdsale.connect(admin).pause();
            
            await expect(
                crowdsale.connect(alice).unpause()
            ).to.be.reverted;
        });

        it("Should emit Paused event", async function () {
            await expect(
                crowdsale.connect(admin).pause()
            ).to.emit(crowdsale, "Paused");
        });

        it("Should emit Unpaused event", async function () {
            await crowdsale.connect(admin).pause();
            
            await expect(
                crowdsale.connect(admin).unpause()
            ).to.emit(crowdsale, "Unpaused");
        });
    });

    describe("🚫 Purchase Blocking", function () {
        beforeEach(async function () {
            await crowdsale.connect(admin).pause();
        });

        it("Should block native purchase when paused", async function () {
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
        });

        it("Should allow phase operations when paused", async function () {
            // Admin can still add phases while paused
            await expect(
                crowdsale.connect(admin).addPhase(PHASE_TARGET, PHASE_PRICE)
            ).to.not.be.reverted;
        });

        it("Should restore functionality after unpause", async function () {
            // Paused - can't buy
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
            
            // Unpause
            await crowdsale.connect(admin).unpause();
            
            // Can buy again
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should allow multiple pause/unpause cycles", async function () {
            // Already paused from beforeEach
            await crowdsale.connect(admin).unpause();
            await crowdsale.connect(admin).pause();
            await crowdsale.connect(admin).unpause();
            
            // Should be unpaused now
            expect(await crowdsale.paused()).to.be.false;
            
            // Can buy
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
    });
});