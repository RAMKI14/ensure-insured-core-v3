const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("⚔ Phase Boundary Exploit Test", function () {

  let token, crowdsale, oracle;
  let owner, admin, treasury, buyers;

  beforeEach(async function () {

    buyers = await ethers.getSigners();
    [owner, admin, , treasury] = buyers;

    const Token = await ethers.getContractFactory("EnsureInsuredToken");
    token = await Token.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    const Oracle = await ethers.getContractFactory("MockOracle");
    oracle = await Oracle.deploy();
    await oracle.waitForDeployment();

    const Crowdsale = await ethers.getContractFactory("EITCrowdsale");

    crowdsale = await Crowdsale.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      treasury.address,
      admin.address
    );

    await crowdsale.waitForDeployment();

    await token.transfer(
      await crowdsale.getAddress(),
      ethers.parseUnits("1000000000", 18)
    );

    // Phase 1
    await crowdsale.connect(admin).addPhase(
      ethers.parseUnits("1000", 18),
      ethers.parseUnits("0.05", 18)
    );

    // Phase 2
    await crowdsale.connect(admin).addPhase(
      ethers.parseUnits("1000", 18),
      ethers.parseUnits("0.08", 18)
    );

    const whitelist = buyers.slice(5, 10).map(x => x.address);

    await crowdsale.connect(admin).addToWhitelist(whitelist);

  });

  it("Cannot exploit phase boundary pricing", async function () {

  const buyer1 = buyers[5];
  const buyer2 = buyers[6];

  // Buyer1 fills most of the phase
  await crowdsale.connect(buyer1).buyWithNative(0, {
    value: ethers.parseEther("0.2")
  });

  // Buyer2 attempts to overflow phase
  await expect(
    crowdsale.connect(buyer2).buyWithNative(0, {
      value: ethers.parseEther("1")
    })
  ).to.be.reverted;

});

});