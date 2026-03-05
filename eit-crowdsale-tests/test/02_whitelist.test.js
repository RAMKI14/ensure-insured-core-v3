const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("👥 EIT Crowdsale - Whitelist Management", function () {
    let token, crowdsale, oracle, usdt;
    let owner, admin, operator, treasury, alice, bob, carol;
    let users;

    beforeEach(async function () {
        [owner, admin, operator, treasury, alice, bob, carol, ...users] = await ethers.getSigners();

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

        await token.transfer(await crowdsale.getAddress(), ethers.parseUnits("1000000000", 18));
    });

    describe("➕ Adding to Whitelist", function () {
        it("Should allow operator to add single user", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.true;
        });

        it("Should allow operator to add multiple users", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
            
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.true;
            expect(await crowdsale.isWhitelisted(bob.address)).to.be.true;
            expect(await crowdsale.isWhitelisted(carol.address)).to.be.true;
        });

        it("Should emit WhitelistUpdated event", async function () {
            await expect(crowdsale.connect(admin).addToWhitelist([alice.address]))
                .to.emit(crowdsale, "WhitelistUpdated")
                .withArgs(alice.address, true);
        });

        it("Should reject non-operator adding to whitelist", async function () {
            await expect(
                crowdsale.connect(alice).addToWhitelist([bob.address])
            ).to.be.reverted;
        });

        it("Should enforce batch size limit of 500", async function () {
            const largeArray = new Array(501).fill(alice.address);
            
            await expect(
                crowdsale.connect(admin).addToWhitelist(largeArray)
            ).to.be.reverted;
        });

        it("Should allow batch of 500 users", async function () {
            // Generate 500 random addresses (not real signers, just for whitelist)
            const addresses = [];
            for (let i = 0; i < 500; i++) {
                addresses.push(ethers.Wallet.createRandom().address);
            }
            
            await expect(
                crowdsale.connect(admin).addToWhitelist(addresses)
            ).to.not.be.reverted;
            
            // Verify first and last
            expect(await crowdsale.isWhitelisted(addresses[0])).to.be.true;
            expect(await crowdsale.isWhitelisted(addresses[499])).to.be.true;
        });

        it("Should reject empty array", async function () {
            await expect(
                crowdsale.connect(admin).addToWhitelist([])
            ).to.be.reverted;
        });
    });

    describe("➖ Removing from Whitelist", function () {
        beforeEach(async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address, bob.address, carol.address]);
        });

        it("Should allow operator to remove user", async function () {
            await crowdsale.connect(admin).removeFromWhitelist([alice.address]);
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.false;
        });

        it("Should emit WhitelistUpdated event on removal", async function () {
            await expect(crowdsale.connect(admin).removeFromWhitelist([alice.address]))
                .to.emit(crowdsale, "WhitelistUpdated")
                .withArgs(alice.address, false);
        });

        it("Should reject non-operator removing from whitelist", async function () {
            await expect(
                crowdsale.connect(alice).removeFromWhitelist([bob.address])
            ).to.be.reverted;
        });

        it("Should allow re-adding after removal", async function () {
            await crowdsale.connect(admin).removeFromWhitelist([alice.address]);
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.false;
            
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.true;
        });

        it("Should enforce batch size limit on removal", async function () {
            const largeArray = new Array(501).fill(alice.address);
            
            await expect(
                crowdsale.connect(admin).removeFromWhitelist(largeArray)
            ).to.be.reverted;
        });
    });

    describe("🚫 Purchase Restrictions", function () {
        beforeEach(async function () {
            await crowdsale.connect(admin).addPhase(
                ethers.parseUnits("5000000", 18),
                ethers.parseUnits("0.05", 18)
            );
        });

        it("Should block non-whitelisted user from buying", async function () {
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Not whitelisted");
        });

        it("Should allow whitelisted user to buy", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should block purchase after removal from whitelist", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            await crowdsale.connect(admin).removeFromWhitelist([alice.address]);
            
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Not whitelisted");
        });

        it("Should allow purchase after re-adding to whitelist", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            await crowdsale.connect(admin).removeFromWhitelist([alice.address]);
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            
            await expect(
                crowdsale.connect(alice).buyWithNative(0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
    });

    describe("🔍 Edge Cases", function () {
        it("Should handle adding same user multiple times", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            await crowdsale.connect(admin).addToWhitelist([alice.address]);
            
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.true;
        });

        it("Should handle removing non-whitelisted user", async function () {
            await expect(
                crowdsale.connect(admin).removeFromWhitelist([alice.address])
            ).to.not.be.reverted;
            
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.false;
        });

        it("Should handle batch with duplicate addresses", async function () {
            await crowdsale.connect(admin).addToWhitelist([alice.address, alice.address, bob.address]);
            
            expect(await crowdsale.isWhitelisted(alice.address)).to.be.true;
            expect(await crowdsale.isWhitelisted(bob.address)).to.be.true;
        });
    });
});
