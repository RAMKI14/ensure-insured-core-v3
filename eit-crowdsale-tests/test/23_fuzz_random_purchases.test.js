const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🧪 Fuzz Test — Random Purchases", function () {

  let token, crowdsale, oracle;
  let owner, admin, operator, treasury, alice, bob, carol;

  const ITERATIONS = 10000;

  beforeEach(async function () {

    [owner, admin, operator, treasury, alice, bob, carol] =
      await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("EnsureInsuredToken");
    token = await Token.deploy(owner.address, owner.address);

    // Deploy oracle
    const Oracle = await ethers.getContractFactory("MockOracle");
    oracle = await Oracle.deploy();

    // Deploy crowdsale (same constructor as Test 01)
    const Crowdsale = await ethers.getContractFactory("EITCrowdsale");

    crowdsale = await Crowdsale.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      treasury.address,
      admin.address
    );

    // Transfer tokens to crowdsale
    await token.transfer(
      await crowdsale.getAddress(),
      ethers.parseUnits("1000000000", 18)
    );

    // Add a test phase so purchases are possible
    await crowdsale.connect(admin).addPhase(
      ethers.parseUnits("5000000", 18),
      ethers.parseUnits("0.05", 18)
    );

    // Whitelist buyers
    await crowdsale.connect(admin).addToWhitelist([
      alice.address,
      bob.address,
      carol.address
    ]);

  });

  it("Random purchases never break invariants", async function () {

    const buyers = [alice, bob, carol];

    for (let i = 0; i < ITERATIONS; i++) {

      const buyer =
        buyers[Math.floor(Math.random() * buyers.length)];

      const eth =
        Math.random() * 0.05 + 0.001;

      try {

        await crowdsale.connect(buyer).buyWithNative(
          0,
          { value: ethers.parseEther(eth.toString()) }
        );

      } catch (err) {
        // expected reverts (caps, limits, phase fills)
      }

      const totalRaised = await crowdsale.totalRaisedUSD();
      const hardCap = await crowdsale.HARD_CAP();

      expect(totalRaised).to.lte(hardCap);

    }

  });

});