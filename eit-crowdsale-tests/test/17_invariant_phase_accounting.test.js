const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Invariant: Phase Accounting", function () {

  let crowdsale;
  let token;
  let oracle;
  let owner;

  beforeEach(async function () {

    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("EnsureInsuredToken");
    token = await Token.deploy(owner.address, owner.address);

    const Oracle = await ethers.getContractFactory("MockOracle");
    oracle = await Oracle.deploy();

    const Crowdsale = await ethers.getContractFactory("EITCrowdsale");

    crowdsale = await Crowdsale.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      owner.address,
      owner.address
    );

    await token.transfer(await crowdsale.getAddress(), ethers.parseEther("1000000000"));

  });

  it("Sum of phase raised must equal totalRaisedUSD", async function () {

    const count = await crowdsale.getPhaseCount();

    let total = 0n;

    for (let i = 0; i < count; i++) {
      const phase = await crowdsale.phases(i);
      total += phase.raisedUSD;
    }

    const global = await crowdsale.totalRaisedUSD();

    expect(total).to.equal(global);

  });

});