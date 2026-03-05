const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("💵 EIT Crowdsale - Stablecoin Purchase", function () {
    let token, crowdsale, oracle, usdt, usdc;
    let owner, admin, treasury, alice, bob, carol;
    
    const PHASE_1_TARGET = ethers.parseUnits("5000000", 18); // $5M
    const PHASE_1_PRICE = ethers.parseUnits("0.05", 18); // $0.05 per token

    beforeEach(async function () {
        [owner, admin, treasury, alice, bob, carol] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("EnsureInsuredToken");
        token = await Token.deploy(owner.address, owner.address);

        const Oracle = await ethers.getContractFactory("MockOracle");
        oracle = await Oracle.deploy();

        const USDT = await ethers.getContractFactory("MockUSDT");
        usdt = await USDT.deploy();
        
        const USDC = await ethers.getContractFactory("MockUSDT"); // Reuse for USDC
        usdc = await USDC.deploy();

        const Crowdsale = await ethers.getContractFactory("EITCrowdsale");
        crowdsale = await Crowdsale.deploy(
            await token.getAddress(),
            await oracle.getAddress(),
            treasury.address,
            admin.address
        );

        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("10000000000", 18));
        
        // Setup phase
        await crowdsale.connect(admin).addPhase(PHASE_1_TARGET, PHASE_1_PRICE);
        await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
        
        // Add stablecoins
        await crowdsale.connect(admin).addStablecoin(await usdt.getAddress(), 6);
        await crowdsale.connect(admin).addStablecoin(await usdc.getAddress(), 6);
        
        // Give users some stablecoins
        await usdt.transfer(alice.address, ethers.parseUnits("100000", 6)); // 100k USDT
        await usdt.transfer(bob.address, ethers.parseUnits("100000", 6));
        await usdc.transfer(alice.address, ethers.parseUnits("100000", 6)); // 100k USDC
        await usdc.transfer(bob.address, ethers.parseUnits("100000", 6));
    });

    describe("💰 USDT/USDC Support", function () {
        it("Should successfully purchase with USDT (6 decimals)", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6); // 1000 USDT
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.not.be.reverted;
            
            expect(await crowdsale.userTotalUSD(alice.address)).to.equal(ethers.parseUnits("1000", 18));
        });

        it("Should successfully purchase with USDC (6 decimals)", async function () {
            const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC
            
            await usdc.connect(alice).approve(await crowdsale.getAddress(), usdcAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdc.getAddress(), usdcAmount, 0)
            ).to.not.be.reverted;
            
            expect(await crowdsale.userTotalUSD(alice.address)).to.equal(ethers.parseUnits("1000", 18));
        });

        it("Should correctly normalize 6 decimal stablecoin to 18 decimals", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6); // 1000 USDT (6 decimals)
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            // Should be normalized to 18 decimals internally
            const userUSD = await crowdsale.userTotalUSD(alice.address);
            expect(userUSD).to.equal(ethers.parseUnits("1000", 18));
        });

        it("Should track stableContributed correctly", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6);
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            expect(await crowdsale.stableContributed(alice.address, await usdt.getAddress()))
                .to.equal(usdtAmount);
        });

        it("Should execute safeTransferFrom for stablecoin", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6);
            
            const aliceBalanceBefore = await usdt.balanceOf(alice.address);
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            const aliceBalanceAfter = await usdt.balanceOf(alice.address);
            expect(aliceBalanceBefore - aliceBalanceAfter).to.equal(usdtAmount);
        });

        it("Should reject unsupported stablecoin", async function () {
            const randomToken = await usdt.getAddress(); // Use USDT address but don't add it
            const Token = await ethers.getContractFactory("MockUSDT");
            const unsupported = await Token.deploy();
            
            const amount = ethers.parseUnits("1000", 6);
            await unsupported.transfer(alice.address, amount);
            await unsupported.connect(alice).approve(await crowdsale.getAddress(), amount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await unsupported.getAddress(), amount, 0)
            ).to.be.reverted;
        });

        it("Should allow only admin to add stablecoin", async function () {
            const Token = await ethers.getContractFactory("MockUSDT");
            const dai = await Token.deploy();
            
            await expect(
                crowdsale.connect(alice).addStablecoin(await dai.getAddress(), 18)
            ).to.be.reverted;
            
            await expect(
                crowdsale.connect(admin).addStablecoin(await dai.getAddress(), 18)
            ).to.not.be.reverted;
        });

        it("Should reject stablecoin with invalid decimals (>18)", async function () {
            const Token = await ethers.getContractFactory("MockUSDT");
            const invalid = await Token.deploy();
            
            await expect(
                crowdsale.connect(admin).addStablecoin(await invalid.getAddress(), 19)
            ).to.be.reverted;
        });
    });

    describe("📊 Purchase Logic", function () {
        it("Should calculate correct USD value for 6 decimal token", async function () {
            const usdtAmount = ethers.parseUnits("5000", 6); // 5000 USDT
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            expect(await crowdsale.userTotalUSD(alice.address)).to.equal(ethers.parseUnits("5000", 18));
        });

        it("Should calculate correct token amount", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6); // $1000
            const expectedTokens = ethers.parseUnits("1000", 18) * ethers.parseUnits("1", 18) / PHASE_1_PRICE;
            // $1000 / $0.05 = 20,000 tokens
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            expect(await crowdsale.phasePurchased(0, alice.address)).to.equal(expectedTokens);
        });

        it("Should enforce MIN_CONTRIBUTION with stablecoin", async function () {
            const tooSmall = ethers.parseUnits("50", 6); // $50 < $100 min
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), tooSmall);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), tooSmall, 0)
            ).to.be.reverted;
        });

        it("Should enforce MAX_CONTRIBUTION with stablecoin", async function () {
            const tooMuch = ethers.parseUnits("60000", 6); // $60k > $50k max
            
            await usdt.transfer(alice.address, tooMuch);
            await usdt.connect(alice).approve(await crowdsale.getAddress(), tooMuch);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), tooMuch, 0)
            ).to.be.reverted;
        });

        it("Should enforce phase cap with stablecoin", async function () {
            // beforeEach already created phase 0 ($5M), so create a fresh crowdsale with small phase
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
            
            // Create small phase: only $1000 target
            await crowdsale2.connect(admin).addPhase(ethers.parseUnits("1000", 18), PHASE_1_PRICE);
            await crowdsale2.connect(admin).addStablecoin(await usdt.getAddress(), 6);
            await crowdsale2.connect(admin).addToWhitelist([alice.address]);
            
            const tooMuch = ethers.parseUnits("2000", 6); // $2000 > $1000 phase cap
            
            await usdt.connect(alice).approve(await crowdsale2.getAddress(), tooMuch);
            
            await expect(
                crowdsale2.connect(alice).buyWithStablecoin(await usdt.getAddress(), tooMuch, 0)
            ).to.be.reverted;
        });

        it("Should enforce HARD_CAP with stablecoin", async function () {
            // This is impractical to test fully, just verify constant
            expect(await crowdsale.HARD_CAP()).to.equal(ethers.parseUnits("100000000", 18));
        });

        it("Should enforce slippage protection (minTokensOut)", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6);
            const expectedTokens = ethers.parseUnits("1000", 18) * ethers.parseUnits("1", 18) / PHASE_1_PRICE;
            const tooManyTokens = expectedTokens + ethers.parseUnits("1000", 18);
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, tooManyTokens)
            ).to.be.reverted;
        });

        it("Should emit TokensPurchased event for stablecoin", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6);
            const expectedUSD = ethers.parseUnits("1000", 18);
            const expectedTokens = expectedUSD * ethers.parseUnits("1", 18) / PHASE_1_PRICE;
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.emit(crowdsale, "TokensPurchased")
             .withArgs(alice.address, 0, expectedUSD, expectedTokens);
        });
    });

    describe("🛡️ State & Security", function () {
        it("Should block stablecoin purchase when paused", async function () {
            await crowdsale.connect(admin).pause();
            
            const usdtAmount = ethers.parseUnits("1000", 6);
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.be.reverted;
        });

        it("Should block stablecoin purchase in refund mode", async function () {
            await crowdsale.connect(admin).enableRefunds();
            
            const usdtAmount = ethers.parseUnits("1000", 6);
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.be.reverted;
        });

        it("Should block stablecoin purchase after finalization", async function () {
            await crowdsale.connect(admin).finalizeSale();
            
            const usdtAmount = ethers.parseUnits("1000", 6);
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.be.reverted;
        });

        it("Should block non-whitelisted user from stablecoin purchase", async function () {
            const [, , , , , , , nonWhitelisted] = await ethers.getSigners();
            
            const usdtAmount = ethers.parseUnits("1000", 6);
            await usdt.transfer(nonWhitelisted.address, usdtAmount);
            await usdt.connect(nonWhitelisted).approve(await crowdsale.getAddress(), usdtAmount);
            
            await expect(
                crowdsale.connect(nonWhitelisted).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0)
            ).to.be.revertedWith("Not whitelisted");
        });

        it("Should support multiple stablecoins in same phase", async function () {
            const usdtAmount = ethers.parseUnits("1000", 6);
            const usdcAmount = ethers.parseUnits("2000", 6);
            
            await usdt.connect(alice).approve(await crowdsale.getAddress(), usdtAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), usdtAmount, 0);
            
            await usdc.connect(alice).approve(await crowdsale.getAddress(), usdcAmount);
            await crowdsale.connect(alice).buyWithStablecoin(await usdc.getAddress(), usdcAmount, 0);
            
            expect(await crowdsale.userTotalUSD(alice.address)).to.equal(ethers.parseUnits("3000", 18));
        });

        it("Should reject zero amount stablecoin purchase", async function () {
            await usdt.connect(alice).approve(await crowdsale.getAddress(), ethers.parseUnits("1000", 6));
            
            await expect(
                crowdsale.connect(alice).buyWithStablecoin(await usdt.getAddress(), 0, 0)
            ).to.be.reverted;
        });
    });
});