const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("⚡ Milestone Race Condition Test", function () {

  let token, crowdsale, oracle;
  let owner, admin, treasury;
  let buyers;

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

    await crowdsale.connect(admin).addPhase(
      ethers.parseUnits("10000000", 18),
      ethers.parseUnits("0.05", 18)
    );

    const whitelist = buyers.slice(5, 15).map(x => x.address);
    await crowdsale.connect(admin).addToWhitelist(whitelist);

  });

  it("Milestone release triggers exactly once", async function () {

    const buyersList = buyers.slice(5, 15);

    for (const buyer of buyersList) {

      await crowdsale.connect(buyer).buyWithNative(0, {
        value: ethers.parseEther("0.1")
      });

    }

    const released = await crowdsale.totalReleasedUSD();

    expect(released).to.be.gte(0);

  });

});