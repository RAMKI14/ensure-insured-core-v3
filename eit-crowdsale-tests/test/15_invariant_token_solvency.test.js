const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Invariant: Token Solvency", function () {

  let crowdsale;
  let token;
  let oracle;
  let owner;
  let user;

  beforeEach(async function () {

    [owner, user] = await ethers.getSigners();

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

  it("Crowdsale must always hold >= tokens sold", async function () {

    const balance = await token.balanceOf(crowdsale.target);
    const sold = await crowdsale.totalTokensSold();

    expect(balance).to.be.gte(sold);

  });

});