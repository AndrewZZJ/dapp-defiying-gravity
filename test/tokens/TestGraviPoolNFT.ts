// tests/TestGraviPoolNFT.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviPoolNFT, GraviCha } from "../../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviPoolNFTFixture() {
  const [owner, minter, user1, user2, customer] = await ethers.getSigners();
  const GraviChaFactory = await ethers.getContractFactory("GraviCha");
  const graviCha = (await GraviChaFactory.deploy()) as GraviCha;
  const GraviPoolNFTFactory = await ethers.getContractFactory("GraviPoolNFT");
  const graviPoolNFT = (await GraviPoolNFTFactory.deploy(graviCha)) as GraviPoolNFT;
  await graviPoolNFT.waitForDeployment();
  return { graviPoolNFT, owner, minter, user1, user2, customer, graviCha };
}

describe("GraviPoolNFT contract", function () {
  describe("Test: Token features", function () {
    it("allows owner to add and update treasury addresses", async () => {
      const { graviPoolNFT, user1, user2 } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());
      const treasuries = await graviPoolNFT.getTreasuryAddresses();
      expect(treasuries[0]).to.equal(await user1.getAddress());

      await graviPoolNFT.setTreasuryAddress(0, await user2.getAddress());
      const updated = await graviPoolNFT.getTreasuryAddresses();
      expect(updated[0]).to.equal(await user2.getAddress());
    });

    it("can mint and transfer NFT with fee", async () => {
      const {  graviPoolNFT, owner, user1, user2 } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());

      const transaction = await graviPoolNFT.mintToPool(await owner.getAddress(), 0, "ipfs://test");
      const receipt = await transaction.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const tokenId = receipt.logs.map(log => graviPoolNFT.interface.parseLog(log)).find(event => event?.name === "Transfer")?.args.tokenId;

      await graviPoolNFT.approve(await user2.getAddress(), tokenId);
      await graviPoolNFT.connect(user2).transferWithFee(
        await owner.getAddress(),
        await user2.getAddress(),
        tokenId,
        { value: ethers.parseEther("0.00001") }
      );

      expect(await graviPoolNFT.ownerOf(tokenId)).to.equal(await user2.getAddress());
    });

    it("starts auction and receives bids", async () => {
      const {  graviPoolNFT, graviCha, owner, user1, minter } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());
      const insurance = await user1.getAddress();

      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(await user1.getAddress(), 1000);
      await graviCha.connect(user1).approve(await graviPoolNFT.getAddress(), 1000);

      await graviPoolNFT.mintAndAuctionNFTs(["ipfs://uri"], [insurance]);
      const ids = await graviPoolNFT.getAuctionedNFTs();
      expect(ids.length).to.equal(1);

      await graviPoolNFT.connect(user1).bid(ids[0], 1000);
      const details = await graviPoolNFT.getAuctionDetails(ids[0]);
      expect(details.highestBidder).to.equal(await user1.getAddress());
    });

    it("refunds outbid bidder and allows withdraw", async () => {
      const {  graviPoolNFT, user1, user2, graviCha, owner, minter } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());
      const insurance = await user1.getAddress();

      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(await user1.getAddress(), 1000);
      await graviCha.connect(minter).mint(await user2.getAddress(), 2000);
      await graviCha.connect(user1).approve(await graviPoolNFT.getAddress(), 1000);
      await graviCha.connect(user2).approve(await graviPoolNFT.getAddress(), 2000);

      await graviPoolNFT.mintAndAuctionNFTs(["ipfs://uri"], [insurance]);
      const ids = await graviPoolNFT.getAuctionedNFTs();

      await graviPoolNFT.connect(user1).bid(ids[0], 1000);
      await graviPoolNFT.connect(user2).bid(ids[0], 1500);

      const refundable = await graviPoolNFT.connect(user1).withdrawableAmount();
      expect(refundable).to.equal(1000);

      await graviPoolNFT.connect(user1).withdraw();
      expect(await graviCha.balanceOf(await user1.getAddress())).to.equal(1000);
    });

    it("burns tokens and transfers NFT to highest bidder on claim", async () => {
      const {  graviPoolNFT, user1, graviCha, owner, minter } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());
      const insurance = await user1.getAddress();

      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(await user1.getAddress(), 5000);
      await graviCha.connect(user1).approve(await graviPoolNFT.getAddress(), 5000);

      await graviPoolNFT.mintAndAuctionNFTs(["ipfs://uri"], [insurance]);
      const ids = await graviPoolNFT.getAuctionedNFTs();
      await graviPoolNFT.connect(user1).bid(ids[0], 3000);

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // +8 days
      await ethers.provider.send("evm_mine", []);

      await graviPoolNFT.connect(user1).claimNFT(ids[0]);
      expect(await graviPoolNFT.ownerOf(ids[0])).to.equal(await user1.getAddress());
      expect(await graviCha.balanceOf(await user1.getAddress())).to.equal(2000);
    });

    it("force ends auction and burns or transfers", async () => {
      const {  graviPoolNFT, user1, graviCha, owner, minter } = await loadFixture(deployGraviPoolNFTFixture);
      await graviPoolNFT.addTreasuryAddress(await user1.getAddress());
      const insurance = await user1.getAddress();

      await graviCha.connect(owner).addMinter(minter.address);
      await graviCha.connect(minter).mint(await user1.getAddress(), 1000);
      await graviCha.connect(user1).approve(await graviPoolNFT.getAddress(), 1000);

      await graviPoolNFT.mintAndAuctionNFTs(["ipfs://uri"], [insurance]);
      const ids = await graviPoolNFT.getAuctionedNFTs();
      await graviPoolNFT.connect(user1).bid(ids[0], 1000);

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await graviPoolNFT.forceEndAuction(ids[0]);
      expect(await graviPoolNFT.ownerOf(ids[0])).to.equal(await user1.getAddress());
    });    
  });
});