// TestGraviGov.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviGov, GraviCha } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviGovFixture() {
  const [owner, minter, user, customer] = await ethers.getSigners();
  const GraviChaFactory = await ethers.getContractFactory("GraviCha");
  const graviCha = (await GraviChaFactory.deploy()) as GraviCha;
  const GraviGovFactory = await ethers.getContractFactory("GraviGov");
  const graviGov = (await GraviGovFactory.deploy(graviCha)) as GraviGov;
  await graviGov.waitForDeployment();
  return { graviGov, owner, minter, user, customer };
}

describe("GraviGov contract", function () {
  describe("Test 1: Token initialization", function () {
      it("should initialize with correct name and symbol", async () => {
        const { graviGov } = await loadFixture(deployGraviGovFixture);
        expect(await graviGov.name()).to.equal("GraviGov");
        expect(await graviGov.symbol()).to.equal("GGOV");
      });
  });

  describe("Test 2: Token functionality (owner, minter, and user)", function () {
    it("should allow owner to mint monthly", async () => {
      const { graviGov, owner } = await loadFixture(deployGraviGovFixture);
      await graviGov.connect(owner).mintMonthly();
      const balance = await graviGov.balanceOf(owner.address);
      expect(balance).to.equal(await graviGov.monthlyMintAmount());
    });

    it("should allow owner to set monthly mint amount", async () => {
      const { graviGov, owner } = await loadFixture(deployGraviGovFixture);
      await graviGov.connect(owner).setMonthlyMintAmount(5000);
      expect(await graviGov.monthlyMintAmount()).to.equal(5000);
    });

    it("should allow owner to mint arbitrary amount", async () => {
      const { graviGov, owner, user } = await loadFixture(deployGraviGovFixture);
      await graviGov.connect(owner).mint(user.address, 1234);
      expect(await graviGov.balanceOf(user.address)).to.equal(1234);
    });

    it("should revert conversion if not enough tokens", async () => {
      const { graviGov, user } = await loadFixture(deployGraviGovFixture);
      await expect(graviGov.connect(user).convertToCharityTokens(1000)).to.be.revertedWith("GraviGov: Not enough tokens");
    });

    it("should allow owner to set and get charity token exchange rate", async () => {
      const { graviGov, owner} = await loadFixture(deployGraviGovFixture);
      await graviGov.connect(owner).setCharityTokenExchangeRate(42);
      expect(await graviGov.getCharityTokenExchangeRate()).to.equal(42);
    });

    it("should track voting power via ERC20Votes", async () => {
      const { graviGov, owner, user } = await loadFixture(deployGraviGovFixture);

      await graviGov.connect(owner).mint(user.address, 1000);
      const votes = await graviGov.getVotes(user.address);
      expect(votes).to.equal(0); // before delegation

      await graviGov.connect(user).delegate(user.address);
      const votesAfter = await graviGov.getVotes(user.address);
      expect(votesAfter).to.equal(1000);
    });
    
  });
});