// TestGraviCha.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviCha } from "../../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviChaFixture() {
  const [owner, minter, user, customer] = await ethers.getSigners();
  const GraviChaFactory = await ethers.getContractFactory("GraviCha");
  const graviCha = (await GraviChaFactory.deploy()) as GraviCha;
  await graviCha.waitForDeployment();
  return { graviCha, owner, minter, user, customer };
}

describe("GraviCha contract", function () {
  describe("Test 1: Token initialization", function () {
    it("should initialize with correct name and symbol", async () => {
      const { graviCha } = await loadFixture(deployGraviChaFixture);
      expect(await graviCha.name()).to.equal("GraviCha");
      expect(await graviCha.symbol()).to.equal("GCHA");
    });
  });

  describe("Test 2: Token functionality (owner, minter, and user", function () {

    it("should allow owner to add and remove minter", async () => {
      const { graviCha, owner, minter } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      expect(await graviCha.minters(minter.address)).to.be.true;
      await graviCha.connect(owner).removeMinter(minter.address);
      expect(await graviCha.minters(minter.address)).to.be.false;
    });

    it("should allow authorized minter to mint tokens", async () => {
      const { graviCha, owner, minter, user } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(user.address, 1000);
      expect(await graviCha.balanceOf(user.address)).to.equal(1000);
    });

    it("should revert if non-minter tries to mint", async () => {
      const { graviCha, user } = await loadFixture(deployGraviChaFixture);
      await expect(graviCha.connect(user).mint(user.address, 1000)).to.be.revertedWith("GraviCha: Not authorized to mint");
    });

    it("should allow user to burn their own tokens", async () => {
      const { graviCha, owner, minter, user } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(user.address, 1000);
      await graviCha.connect(user).burn(400);
      expect(await graviCha.balanceOf(user.address)).to.equal(600);
    });

    it("should allow user to burn tokens via allowance", async () => {
      const { graviCha, owner, minter, user } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(user.address, 1000);
      await graviCha.connect(user).approve(owner.address, 500);
      await graviCha.connect(owner).burnFrom(user.address, 300);
      expect(await graviCha.balanceOf(user.address)).to.equal(700);
    });

    it("should revert if trying to burnFrom without enough allowance", async () => {
      const { graviCha, owner, minter, user } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(user.address, 1000);
      await expect(graviCha.connect(owner).burnFrom(user.address, 500)).to.be.reverted;
    });

    it("should allow owner to burnFrom any account", async () => {
      const { graviCha, owner, minter, user } = await loadFixture(deployGraviChaFixture);
      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(user.address, 1000);
      await graviCha.connect(owner).burnFromByOwner(user.address, 600);
      expect(await graviCha.balanceOf(user.address)).to.equal(400);
    });
  });
});