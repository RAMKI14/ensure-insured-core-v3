const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🏁 EIT Crowdsale - Finalization & Withdrawal", function () {
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

    describe("✅ Finalization", function () {
        it("Should allow admin to finalize", async function () {
            await expect(
                crowdsale.connect(admin).finalizeSale()
            ).to.not.be.reverted;
        });

        it("Should change state to Finalized", async function () {
            await crowdsale.connect(admin).finalizeSale();
            expect(await crowdsale.saleState()).to.equal(2); // Finalized
        });

        it("Should emit SaleFinalized event", async function () {
            await expect(
                crowdsale.connect(admin).finalizeSale()
            ).to.emit(crowdsale, "SaleFinalized");
        });

        it("Should prevent finalization in refund mode", async function () {
            // Enable refunds first
            await crowdsale.connect(admin).enableRefunds();
            
            // Try to finalize - should fail
            await expect(
                crowdsale.connect(admin).finalizeSale()
            ).to.be.reverted;
        });

        it("Should reject non-admin finalization", async function () {
            await expect(
                crowdsale.connect(alice).finalizeSale()
            ).to.be.reverted;
        });

        it("Should prevent purchases after finalization", async function () {
            await crowdsale.connect(admin).finalizeSale();
            
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.reverted;
        });
    });

    describe("💼 Withdraw Unsold", function () {
        it("Should prevent withdrawal before finalization", async function () {
            // Try to withdraw before finalization
            await expect(
                crowdsale.connect(admin).withdrawUnsoldTokens()
            ).to.be.reverted;
        });

        it("Should calculate unsold tokens correctly", async function () {
            // Alice buys some tokens
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const totalTokensSold = await crowdsale.totalTokensSold();
            const crowdsaleBalance = await token.balanceOf(await crowdsale.getAddress());
            const unsold = crowdsaleBalance - totalTokensSold;
            
            expect(unsold).to.be.gt(0);
        });

        it("Should protect totalTokensSold", async function () {
            // Buy some tokens
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const soldBefore = await crowdsale.totalTokensSold();
            
            // Finalize and withdraw
            await crowdsale.connect(admin).finalizeSale();
            await crowdsale.connect(admin).withdrawUnsoldTokens();
            
            // totalTokensSold should not change
            expect(await crowdsale.totalTokensSold()).to.equal(soldBefore);
        });

        it("Should send tokens to treasury", async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            await crowdsale.connect(admin).finalizeSale();
            
            const treasuryBefore = await token.balanceOf(treasury.address);
            await crowdsale.connect(admin).withdrawUnsoldTokens();
            const treasuryAfter = await token.balanceOf(treasury.address);
            
            expect(treasuryAfter).to.be.gt(treasuryBefore);
        });

        it("Should maintain balance invariant", async function () {
            // Invariant: balance >= totalTokensSold (always)
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("10") });
            
            const balance = await token.balanceOf(await crowdsale.getAddress());
            const sold = await crowdsale.totalTokensSold();
            
            expect(balance).to.be.gte(sold);
            
            // After withdrawal, claimed tokens still protected
            await crowdsale.connect(admin).finalizeSale();
            await crowdsale.connect(admin).withdrawUnsoldTokens();
            
            const balanceAfter = await token.balanceOf(await crowdsale.getAddress());
            expect(balanceAfter).to.be.gte(sold); // Still protects sold tokens
        });

        it("Should prevent double withdrawal", async function () {
            await crowdsale.connect(admin).finalizeSale();
            await crowdsale.connect(admin).withdrawUnsoldTokens();
            
            // Try to withdraw again
            await expect(
                crowdsale.connect(admin).withdrawUnsoldTokens()
            ).to.be.reverted; // Already withdrawn flag
        });
    });
});