const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔥 Stress Test - Many Buyers", function () {

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

  });

  it("Handles many buyers without accounting errors", async function () {

    // Hardhat provides ~20 funded accounts
    const usableBuyers = buyers.slice(5, 20);

    const whitelist = usableBuyers.map(x => x.address);

    await crowdsale.connect(admin).addToWhitelist(whitelist);

    for (const buyer of usableBuyers) {

      await crowdsale
        .connect(buyer)
        .buyWithNative(0, {
          value: ethers.parseEther("0.1")
        });

    }

    const raised = await crowdsale.totalRaisedUSD();
    const sold = await crowdsale.totalTokensSold();

    expect(raised).to.be.gt(0);
    expect(sold).to.be.gt(0);

    const balance = await token.balanceOf(await crowdsale.getAddress());

    expect(balance).to.be.gte(sold);

  });

});