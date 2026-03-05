const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Invariant: Hard Cap", function () {

  let crowdsale;

  beforeEach(async function () {

    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("EnsureInsuredToken");
    const token = await Token.deploy(owner.address, owner.address);

    const Oracle = await ethers.getContractFactory("MockOracle");
    const oracle = await Oracle.deploy();

    const Crowdsale = await ethers.getContractFactory("EITCrowdsale");

    crowdsale = await Crowdsale.deploy(
      token.target,
      oracle.target,
      owner.address,
      owner.address
    );

  });

  it("Total raised must never exceed HARD_CAP", async function () {

    const raised = await crowdsale.totalRaisedUSD();
    const hardcap = await crowdsale.HARD_CAP();

    expect(raised).to.be.lte(hardcap);

  });

});