// TestGraviGov.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviGov, GraviDAO } from "../../typechain-types";
import { loadFixture, mine } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviGovFixture() {
  const [owner, minter, user, customer] = await ethers.getSigners();
  const GraviGovFactory = await ethers.getContractFactory("GraviGov");
  const graviGov = (await GraviGovFactory.deploy()) as GraviGov;
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

  describe("Test 2: Token functionality", function () {
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

  describe("Test 3: Permission Controls", function () {
    it("should revert when non-owner tries to mint", async () => {
      const { graviGov, user } = await loadFixture(deployGraviGovFixture);
      
      await expect(
        graviGov.connect(user).mint(user.address, 1000)
      ).to.be.revertedWithCustomError(graviGov, "OwnableUnauthorizedAccount");
    });
    
    it("should revert when non-owner tries to mint monthly", async () => {
      const { graviGov, user } = await loadFixture(deployGraviGovFixture);
      
      await expect(
        graviGov.connect(user).mintMonthly()
      ).to.be.revertedWithCustomError(graviGov, "OwnableUnauthorizedAccount");
    });
    
    it("should revert when non-owner tries to set monthly mint amount", async () => {
      const { graviGov, user } = await loadFixture(deployGraviGovFixture);
      
      await expect(
        graviGov.connect(user).setMonthlyMintAmount(5000)
      ).to.be.revertedWithCustomError(graviGov, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Test 4: ERC20Votes Functionality", function () {
    it("should properly track voting power across transfers", async () => {
      const { graviGov, owner, user, customer } = await loadFixture(deployGraviGovFixture);
      
      // Mint tokens to user
      await graviGov.connect(owner).mint(user.address, ethers.parseEther("100"));
      
      // User delegates to self
      await graviGov.connect(user).delegate(user.address);
      expect(await graviGov.getVotes(user.address)).to.equal(ethers.parseEther("100"));
      
      // Transfer half to customer
      await graviGov.connect(user).transfer(customer.address, ethers.parseEther("50"));
      
      // Check voting power was reduced for user
      expect(await graviGov.getVotes(user.address)).to.equal(ethers.parseEther("50"));
      
      // Customer delegates to self
      await graviGov.connect(customer).delegate(customer.address);
      expect(await graviGov.getVotes(customer.address)).to.equal(ethers.parseEther("50"));
      
      // Customer delegates to user
      await graviGov.connect(customer).delegate(user.address);
      expect(await graviGov.getVotes(user.address)).to.equal(ethers.parseEther("100"));
      expect(await graviGov.getVotes(customer.address)).to.equal(0);
    });
    
    it("should properly handle delegation history", async () => {
      const { graviGov, owner, user } = await loadFixture(deployGraviGovFixture);
      
      // Mint tokens to user
      await graviGov.connect(owner).mint(user.address, ethers.parseEther("100"));
      
      // Get current block number
      const blockNumber = await ethers.provider.getBlockNumber();
      
      // User delegates to self
      await graviGov.connect(user).delegate(user.address);
      
      // Move forward a few blocks
      await mine(5);
      
      // Check past voting power
      expect(await graviGov.getPastVotes(user.address, blockNumber)).to.equal(0);
      expect(await graviGov.getPastVotes(user.address, blockNumber + 1)).to.equal(ethers.parseEther("100"));
      
      // Get total supply history
      expect(await graviGov.getPastTotalSupply(blockNumber)).to.be.gte(0);
    });
  });
});