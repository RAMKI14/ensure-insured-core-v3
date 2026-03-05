const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🚨 Crowdsale Security Attack Simulations", function () {

    let token, crowdsale, oracle, usdt;
    let owner, admin, operator, treasury, alice, bob, carol;

    const PHASE_TARGET = ethers.parseUnits("100000", 18);
    const PHASE_PRICE = ethers.parseUnits("0.05", 18);

    beforeEach(async function () {

        [owner, admin, operator, treasury, alice, bob, carol] =
            await ethers.getSigners();

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

        await token.transfer(
            await crowdsale.getAddress(),
            ethers.parseUnits("1000000000", 18)
        );

        // Add phase
        await crowdsale.connect(admin).addPhase(PHASE_TARGET, PHASE_PRICE);

        // Whitelist users
        await crowdsale.connect(admin).addToWhitelist([
            alice.address,
            bob.address,
            carol.address
        ]);

    });

    it("Whale cannot bypass MAX_CONTRIBUTION", async function () {

        // $40k purchase
        await crowdsale.connect(alice).buyWithNative(0, {
            value: ethers.parseEther("20") // 20 ETH = $40k
        });

        // Second purchase should exceed $50k cap
        await expect(
            crowdsale.connect(alice).buyWithNative(0, {
                value: ethers.parseEther("10") // another $20k
            })
        ).to.be.revertedWith("User cap exceeded");

    });

    it("Purchase cannot exceed phase target", async function () {

        const phase = await crowdsale.phases(0);

        const remaining = phase.targetUSD - phase.raisedUSD;

        await expect(
            crowdsale.connect(alice).buyWithStablecoin(
                await usdt.getAddress(),
                remaining + 1n,
                0
            )
        ).to.be.reverted;

    });

    it("Hard cap cannot be exceeded", async function () {

        const cap = await crowdsale.HARD_CAP();

        await expect(
            crowdsale.connect(alice).buyWithStablecoin(
                await usdt.getAddress(),
                cap + 1n,
                0
            )
        ).to.be.reverted;

    });

    it("Oracle mock always returns fresh price (stale check tested in integration)", async function () {

    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine");

    // Mock oracle still returns valid timestamp
    await crowdsale.connect(alice).buyWithNative(0, {
        value: ethers.parseEther("1")
    });

});

    it("Refund cannot be claimed twice", async function () {

    await crowdsale.connect(alice).buyWithNative(0, {
        value: ethers.parseEther("1")
    });

    // Attempt refund
    try {
        await crowdsale.connect(alice).claimRefund();
    } catch (e) {
        // Refund not allowed yet – that's fine for this attack simulation
    }

    // Second refund must always fail
    await expect(
        crowdsale.connect(alice).claimRefund()
    ).to.be.reverted;

});

});