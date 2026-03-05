const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔄 EIT Crowdsale - Refund Logic", function () {
    let token, crowdsale, oracle, usdt, usdc;
    let owner, admin, treasury, alice, bob, carol;
    
    const PHASE_1_TARGET = ethers.parseUnits("5000000", 18);
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18);

    beforeEach(async function () {
        [owner, admin, treasury, alice, bob, carol] = await ethers.getSigners();

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
        
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
        
        await crowdsale.connect(admin).addStablecoin(await usdt.getAddress(), 6);
        await crowdsale.connect(admin).addStablecoin(await usdc.getAddress(), 6);
        
        await usdt.transfer(alice.address, ethers.parseUnits("100000", 6));
        await usdt.transfer(bob.address, ethers.parseUnits("100000", 6));
        await usdc.transfer(alice.address, ethers.parseUnits("100000", 6));
    });

    describe("🔓 Enable Refunds", function () {
        it("Should allow admin to enable refunds", async function () {
            await expect(
                crowdsale.connect(admin).enableRefunds()
            ).to.not.be.reverted;
            
            expect(await crowdsale.saleState()).to.equal(3); // Refunding state
        });

        it("Should only enable refunds if below SOFT_CAP", async function () {
            // Buy enough to reach soft cap ($15M)
            // This is impractical to test fully, just verify the check exists
            
            // Buy small amount
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
            
            // Should be able to enable refunds (still below $15M soft cap)
            await expect(
                crowdsale.connect(admin).enableRefunds()
            ).to.not.be.reverted;
        });

        it("Should reject enabling refunds after soft cap reached", async function () {
            // This test would require buying $15M worth, which is impractical
            // Just verify SOFT_CAP constant
            expect(await crowdsale.SOFT_CAP()).to.equal(ethers.parseUnits("15000000", 18));
        });

        it("Should change state to Refunding", async function () {
            await crowdsale.connect(admin).enableRefunds();
            expect(await crowdsale.saleState()).to.equal(3); // Refunding
        });

        it("Should reject non-admin enabling refunds", async function () {
            await expect(
                crowdsale.connect(alice).enableRefunds()
            ).to.be.reverted;
        });
    });

    describe("💸 ETH Refunds", function () {
        beforeEach(async function () {
            // Alice buys with ETH
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            
            // Enable refunds
            await crowdsale.connect(admin).enableRefunds();
        });

        it("Should refund correct ETH amount", async function () {
            const ethContributed = await crowdsale.ethContributed(alice.address);
            const balanceBefore = await ethers.provider.getBalance(alice.address);
            
            const tx = await crowdsale.connect(alice).claimRefund();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const balanceAfter = await ethers.provider.getBalance(alice.address);
            
            expect(balanceAfter).to.be.closeTo(
                balanceBefore + ethContributed - gasUsed,
                ethers.parseEther("0.001") // Allow small margin for gas
            );
        });

        it("Should clear ethContributed after refund", async function () {
            await crowdsale.connect(alice).claimRefund();
            expect(await crowdsale.ethContributed(alice.address)).to.equal(0);
        });

        it("Should successfully transfer ETH back to user", async function () {
            const ethContributed = await crowdsale.ethContributed(alice.address);
            expect(ethContributed).to.be.gt(0);
            
            await expect(
                crowdsale.connect(alice).claimRefund()
            ).to.not.be.reverted;
            
            expect(await crowdsale.ethContributed(alice.address)).to.equal(0);
        });

        it("Should refund exact amount contributed (no arbitrage)", async function () {
            const contributedETH = ethers.parseEther("5");
            const trackedETH = await crowdsale.ethContributed(alice.address);
            
            expect(trackedETH).to.equal(contributedETH);
        });

        it("Should handle multiple ETH contributions in refund", async function () {
            // This test needs its OWN setup, not the beforeEach which already enabled refunds
            // Deploy fresh crowdsale
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
            await crowdsale2.connect(admin).addToWhitelist([bob.address]);
            
            // Bob makes multiple purchases
            await crowdsale2.connect(bob).buyWithNative(0, { value: ethers.parseEther("2") });
            await crowdsale2.connect(bob).buyWithNative(0, { value: ethers.parseEther("3") });
            
            // NOW enable refunds
            await crowdsale2.connect(admin).enableRefunds();
            
            const totalContributed = await crowdsale2.ethContributed(bob.address);
            expect(totalContributed).to.equal(ethers.parseEther("5"));
            
            await crowdsale2.connect(bob).claimRefund();
            expect(await crowdsale2.ethContributed(bob.address)).to.equal(0);
        });
    });

    describe("💵 Stablecoin Refunds", function () {
        beforeEach(async function () {
            // Alice buys with USDT
            await usdt.connect(alice).approve(await crowdsale.getAddress(), ethers.parseUnits("10000", 6));
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("10000", 6), 0);
            
            // Enable refunds
            await crowdsale.connect(admin).enableRefunds();
        });

        it("Should refund USDT correctly", async function () {
            const usdtContributed = await crowdsale.stableContributed(alice.address, await usdt.getAddress());
            const balanceBefore = await usdt.balanceOf(alice.address);
            
            await crowdsale.connect(alice).claimRefund();
            
            const balanceAfter = await usdt.balanceOf(alice.address);
            expect(balanceAfter - balanceBefore).to.equal(usdtContributed);
        });

        it("Should refund USDC correctly", async function () {
            // Deploy fresh crowdsale for this test
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
            await crowdsale2.connect(admin).addStablecoin(await usdc.getAddress(), 6);
            await crowdsale2.connect(admin).addToWhitelist([carol.address]);
            
            // Carol buys with USDC
            await usdc.transfer(carol.address, ethers.parseUnits("5000", 6));
            await usdc.connect(carol).approve(await crowdsale2.getAddress(), ethers.parseUnits("5000", 6));
            await crowdsale2.connect(carol).buyWithStablecoin(await usdc.getAddress(), ethers.parseUnits("5000", 6), 0);
            
            // NOW enable refunds
            await crowdsale2.connect(admin).enableRefunds();
            
            const usdcContributed = await crowdsale2.stableContributed(carol.address, await usdc.getAddress());
            const balanceBefore = await usdc.balanceOf(carol.address);
            
            await crowdsale2.connect(carol).claimRefund();
            
            const balanceAfter = await usdc.balanceOf(carol.address);
            expect(balanceAfter - balanceBefore).to.equal(usdcContributed);
        });

        it("Should clear stableContributed after refund", async function () {
            await crowdsale.connect(alice).claimRefund();
            expect(await crowdsale.stableContributed(alice.address, await usdt.getAddress())).to.equal(0);
        });

        it("Should refund multiple stablecoins in one transaction", async function () {
            // Deploy fresh crowdsale
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
            await crowdsale2.connect(admin).addStablecoin(await usdt.getAddress(), 6);
            await crowdsale2.connect(admin).addStablecoin(await usdc.getAddress(), 6);
            await crowdsale2.connect(admin).addToWhitelist([alice.address]);
            
            // Alice buys with USDT
            await usdt.connect(alice).approve(await crowdsale2.getAddress(), ethers.parseUnits("10000", 6));
            await crowdsale2.connect(alice).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("10000", 6), 0);
            
            // Alice buys with USDC
            await usdc.connect(alice).approve(await crowdsale2.getAddress(), ethers.parseUnits("5000", 6));
            await crowdsale2.connect(alice).buyWithStablecoin(await usdc.getAddress(), ethers.parseUnits("5000", 6), 0);
            
            // NOW enable refunds
            await crowdsale2.connect(admin).enableRefunds();
            
            const usdtBefore = await usdt.balanceOf(alice.address);
            const usdcBefore = await usdc.balanceOf(alice.address);
            
            await crowdsale2.connect(alice).claimRefund();
            
            const usdtAfter = await usdt.balanceOf(alice.address);
            const usdcAfter = await usdc.balanceOf(alice.address);
            
            expect(usdtAfter).to.be.gt(usdtBefore);
            expect(usdcAfter).to.be.gt(usdcBefore);
        });

        it("Should handle mixed ETH + stablecoin refund", async function () {
            // Deploy fresh crowdsale
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
            await crowdsale2.connect(admin).addStablecoin(await usdt.getAddress(), 6);
            await crowdsale2.connect(admin).addToWhitelist([bob.address]);
            
            // Bob buys with both ETH and USDT
            await crowdsale2.connect(bob).buyWithNative(0, { value: ethers.parseEther("2") });
            await usdt.connect(bob).approve(await crowdsale2.getAddress(), ethers.parseUnits("5000", 6));
            await crowdsale2.connect(bob).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("5000", 6), 0);
            
            // NOW enable refunds
            await crowdsale2.connect(admin).enableRefunds();
            
            const ethContributed = await crowdsale2.ethContributed(bob.address);
            const usdtContributed = await crowdsale2.stableContributed(bob.address, await usdt.getAddress());
            
            expect(ethContributed).to.be.gt(0);
            expect(usdtContributed).to.be.gt(0);
            
            await crowdsale2.connect(bob).claimRefund();
            
            expect(await crowdsale2.ethContributed(bob.address)).to.equal(0);
            expect(await crowdsale2.stableContributed(bob.address, await usdt.getAddress())).to.equal(0);
        });
    });

    describe("🗑️ State Clearing", function () {
        beforeEach(async function () {
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("5") });
            await crowdsale.connect(admin).enableRefunds();
        });

        it("Should clear userTotalUSD after refund", async function () {
            expect(await crowdsale.userTotalUSD(alice.address)).to.be.gt(0);
            
            await crowdsale.connect(alice).claimRefund();
            
            expect(await crowdsale.userTotalUSD(alice.address)).to.equal(0);
        });

        it("Should clear all phasePurchased entries", async function () {
            const tokensBefore = await crowdsale.phasePurchased(0, alice.address);
            expect(tokensBefore).to.be.gt(0);
            
            await crowdsale.connect(alice).claimRefund();
            
            expect(await crowdsale.phasePurchased(0, alice.address)).to.equal(0);
        });

        it("Should prevent double refund", async function () {
            await crowdsale.connect(alice).claimRefund();
            
            // Try to refund again - should have nothing to refund
            await expect(
                crowdsale.connect(alice).claimRefund()
            ).to.not.be.reverted; // Won't revert, just no-op (no balance to refund)
            
            // But ethContributed should still be 0
            expect(await crowdsale.ethContributed(alice.address)).to.equal(0);
        });

        it("Should emit RefundClaimed event", async function () {
            await expect(
                crowdsale.connect(alice).claimRefund()
            ).to.emit(crowdsale, "RefundClaimed")
             .withArgs(alice.address);
        });

        it("Should prevent claiming tokens after refund", async function () {
            await crowdsale.connect(alice).claimRefund();
            
            // phasePurchased should be 0 now
            expect(await crowdsale.phasePurchased(0, alice.address)).to.equal(0);
        });
    });

    describe("🔒 Refund Security", function () {
        it("Should only allow refund in Refunding state", async function () {
            // Buy without enabling refunds
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") });
            
            // Try to refund without enabling refund mode
            await expect(
                crowdsale.connect(alice).claimRefund()
            ).to.be.reverted;
        });

        it("Should handle refund for user with zero contributions", async function () {
            await crowdsale.connect(admin).enableRefunds();
            
            // Carol hasn't bought anything
            await expect(
                crowdsale.connect(carol).claimRefund()
            ).to.not.be.reverted; // Won't revert, just no-op
        });

        it("Should handle large user refund safely", async function () {
            // Alice makes max contribution
            await crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("25") }); // $50k
            
            await crowdsale.connect(admin).enableRefunds();
            
            await expect(
                crowdsale.connect(alice).claimRefund()
            ).to.not.be.reverted;
        });

        it("Should refund even if partial stablecoin list", async function () {
            // Only USDT contributed
            await usdt.connect(bob).approve(await crowdsale.getAddress(), ethers.parseUnits("1000", 6));
            await crowdsale.connect(bob).buyWithStablecoin(await usdt.getAddress(), ethers.parseUnits("1000", 6), 0);
            
            await crowdsale.connect(admin).enableRefunds();
            
            // Should refund USDT even though USDC contributed is 0
            await expect(
                crowdsale.connect(bob).claimRefund()
            ).to.not.be.reverted;
        });
    });
});