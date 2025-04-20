import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviDAO, GraviCha, GraviGov, GraviPoolNFT, GraviInsurance } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("GraviDAO", function () {
  async function deployDAOFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy tokens
    const GraviChaFactory = await ethers.getContractFactory("GraviCha");
    const graviCha = await GraviChaFactory.deploy();
    
    const GraviGovFactory = await ethers.getContractFactory("GraviGov");
    const graviGov = await GraviGovFactory.deploy();
    
    // Deploy DAO
    const GraviDAOFactory = await ethers.getContractFactory("GraviDAO");
    const graviDAO = await GraviDAOFactory.deploy(await graviCha.getAddress(), await graviGov.getAddress());
    
    // Deploy NFT pool
    const GraviPoolNFTFactory = await ethers.getContractFactory("GraviPoolNFT");
    const graviPoolNFT = await GraviPoolNFTFactory.deploy(await graviCha.getAddress());
    
    // Deploy mock insurance
    const GraviInsuranceFactory = await ethers.getContractFactory("GraviInsurance");
    const mockInsurance = await GraviInsuranceFactory.deploy(
      "flood", // disaster type
      ethers.parseEther("5"), // premium
      await graviCha.getAddress()
    );
    
    // IMPORTANT: Mint governance tokens BEFORE transferring ownership
    // This way the deployer can mint tokens while still being the owner
    await graviGov.mint(user1.address, ethers.parseEther("1000"));
    await graviGov.mint(user2.address, ethers.parseEther("500"));
    await graviGov.mint(user3.address, ethers.parseEther("200"));
    await graviGov.mint(await graviDAO.getAddress(), ethers.parseEther("5000"));
    
    // Set up minters for GraviCha
    await graviCha.addMinter(await graviDAO.getAddress());
    await graviCha.addMinter(owner.address);
    
    // Mint some GraviCha to users for testing
    await graviCha.mint(user1.address, ethers.parseEther("1000"));
    await graviCha.mint(user2.address, ethers.parseEther("500"));
    
    // AFTER minting, transfer ownership
    await graviCha.transferOwnership(await graviDAO.getAddress());
    await graviGov.transferOwnership(await graviDAO.getAddress());
    await graviPoolNFT.transferOwnership(await graviDAO.getAddress());
    await mockInsurance.transferOwnership(await graviDAO.getAddress());
    
    return { 
      graviDAO, graviCha, graviGov, graviPoolNFT, mockInsurance, 
      owner, user1, user2, user3 
    };
  }

  describe("Initialization", function () {
    it("Should initialize with correct token addresses", async function () {
      const { graviDAO, graviCha, graviGov } = await loadFixture(deployDAOFixture);
      
      expect(await graviDAO.graviCha()).to.equal(await graviCha.getAddress());
      expect(await graviDAO.graviGov()).to.equal(await graviGov.getAddress());
    });
    
    it("Should have correct default values", async function () {
      const { graviDAO } = await loadFixture(deployDAOFixture);
      
      expect(await graviDAO.govTokenEthPrice()).to.equal(ethers.parseEther("0.01"));
      expect(await graviDAO.govTokenGraviChaBurn()).to.equal(ethers.parseEther("10"));
      expect(await graviDAO.moderatorRewardsEnabled()).to.be.true;
    });
  });

  describe("Governance Token Management", function () {
    it("Should allow governance to set token parameters", async function () {
      const { graviDAO, owner } = await loadFixture(deployDAOFixture);
      
      await graviDAO.connect(owner).setGovernanceTokenParameters(
        ethers.parseEther("0.02"), // new price
        ethers.parseEther("20"),   // new burn amount
        ethers.parseEther("5000")  // new monthly mint amount
      );
      
      expect(await graviDAO.govTokenEthPrice()).to.equal(ethers.parseEther("0.02"));
      expect(await graviDAO.govTokenGraviChaBurn()).to.equal(ethers.parseEther("20"));
    });
    
    it("Should allow users to purchase governance tokens", async function () {
      const { graviDAO, graviCha, graviGov, user1, owner } = await loadFixture(deployDAOFixture);
      
      // The DAO already has tokens from the fixture setup (5000 ether)
      // No need to mint more tokens
      
      // Get the user's initial balance
      const initialBalance = await graviGov.balanceOf(user1.address);
      
      // Approve GraviCha tokens for burning
      await graviCha.connect(user1).approve(await graviDAO.getAddress(), ethers.parseEther("100"));
      
      // Purchase tokens (1 token at 0.01 ETH each)
      const amount = ethers.parseEther("1");
      await graviDAO.connect(user1).purchaseGovTokens(amount, {
        value: ethers.parseEther("0.01")
      });
      
      // Verify balance changes
      const finalBalance = await graviGov.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });
    
    it("Should calculate token purchase price correctly", async function () {
      const { graviDAO } = await loadFixture(deployDAOFixture);
      
      // Test with wei values as expected in the contract
      const amount = ethers.parseEther("5"); // 5 tokens in wei
      const [ethPrice, chaPrice] = await graviDAO.calculatesGovTokenPurchasePrice(amount);
      
      // 5 tokens * 0.01 ETH = 0.05 ETH
      expect(ethPrice).to.equal(ethers.parseEther("0.05")); 
      
      // 5 tokens * 10 ETH = 50 ETH of GraviCha tokens
      expect(chaPrice).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Insurance Pool Management", function () {
    it("Should set NFT pool correctly", async function () {
      const { graviDAO, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      
      expect(await graviDAO.nftPool()).to.equal(await graviPoolNFT.getAddress());
    });
    
    it("Should add insurance pool correctly", async function () {
      const { graviDAO, mockInsurance, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      // First set the NFT pool
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      
      // Add the insurance pool
      const poolName = "Flood Insurance";
      await graviDAO.connect(owner).addInsurancePool(poolName, await mockInsurance.getAddress());
      
      // Verify it was added correctly
      expect(await graviDAO.insurancePools(poolName)).to.equal(await mockInsurance.getAddress());
      const poolNames = await graviDAO.getAllInsurancePoolNames();
      expect(poolNames).to.include(poolName);
    });
    
    it("Should remove insurance pool correctly", async function () {
      const { graviDAO, mockInsurance, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      // First set up the pool
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      const poolName = "Flood Insurance";
      await graviDAO.connect(owner).addInsurancePool(poolName, await mockInsurance.getAddress());
      
      // Remove the insurance pool
      await graviDAO.connect(owner).removeInsurancePool(poolName);
      
      // Verify it was removed
      expect(await graviDAO.insurancePools(poolName)).to.equal(ethers.ZeroAddress);
    });
    
    it("Should get insurance pool addresses correctly", async function () {
      const { graviDAO, mockInsurance, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      // Set up the pools
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      const poolName = "Flood Insurance";
      await graviDAO.connect(owner).addInsurancePool(poolName, await mockInsurance.getAddress());
      
      // Get the addresses
      const [insuranceAddress, nftAddress] = await graviDAO.getInsurancePoolAddresses(poolName);
      
      expect(insuranceAddress).to.equal(await mockInsurance.getAddress());
      expect(nftAddress).to.equal(await graviPoolNFT.getAddress());
    });
  });

  describe("Moderator System", function () {
    it("Should allow users to nominate moderators", async function () {
      const { graviDAO, user1, user2 } = await loadFixture(deployDAOFixture);
      
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      const nomination = await graviDAO.nominatedModerators(user2.address);
      expect(nomination.moderator).to.equal(user2.address);
      expect(nomination.nominator).to.equal(user1.address);
      expect(nomination.votes).to.equal(0);
    });
    
    it("Should allow users to vote for moderators", async function () {
      const { graviDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Nominate first
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Vote
      await graviDAO.connect(user3).voteForModerator(user2.address);
      
      // Check votes
      const nomination = await graviDAO.nominatedModerators(user2.address);
      expect(nomination.votes).to.equal(1);
      expect(await graviDAO.hasVotedForModerator(user3.address, user2.address)).to.be.true;
    });
    
    it("Should prevent double voting for moderators", async function () {
      const { graviDAO, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Nominate first
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Vote once
      await graviDAO.connect(user1).voteForModerator(user2.address);
      
      // Try to vote again
      await expect(graviDAO.connect(user1).voteForModerator(user2.address))
        .to.be.revertedWith("Already voted");
    });
    
    it("Should toggle moderator rewards", async function () {
      const { graviDAO, owner } = await loadFixture(deployDAOFixture);
      
      // Initially true
      expect(await graviDAO.moderatorRewardsEnabled()).to.be.true;
      
      // Toggle off
      await graviDAO.connect(owner).toggleModeratorRewards(false);
      expect(await graviDAO.moderatorRewardsEnabled()).to.be.false;
      
      // Toggle back on
      await graviDAO.connect(owner).toggleModeratorRewards(true);
      expect(await graviDAO.moderatorRewardsEnabled()).to.be.true;
    });
    
    it("Should set moderator thresholds", async function () {
      const { graviDAO, owner } = await loadFixture(deployDAOFixture);
      
      const newNominationThreshold = ethers.parseEther("200");
      const newVotingThreshold = ethers.parseEther("5");
      
      await graviDAO.connect(owner).setModeratorThresholds(
        newNominationThreshold,
        newVotingThreshold
      );
      
      expect(await graviDAO.moderatorNominationThreshold()).to.equal(newNominationThreshold);
      expect(await graviDAO.moderatorVotingThreshold()).to.equal(newVotingThreshold);
    });
    
    it("Should get top moderators correctly", async function () {
      const { graviDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Nominate two moderators
      await graviDAO.connect(user1).nominateModerator(user2.address);
      await graviDAO.connect(user1).nominateModerator(user3.address);
      
      // Vote differently
      await graviDAO.connect(user1).voteForModerator(user2.address); // 1 vote
      await graviDAO.connect(user2).voteForModerator(user3.address); // 1 vote
      await graviDAO.connect(user3).voteForModerator(user3.address); // 2 votes total
      
      // Get top moderators
      const [topModerators, votes] = await graviDAO.getTopModerators(2);
      
      // user3 should be first with 2 votes, user2 second with 1 vote
      expect(topModerators[0]).to.equal(user3.address);
      expect(votes[0]).to.equal(2);
      expect(topModerators[1]).to.equal(user2.address);
      expect(votes[1]).to.equal(1);
    });
    
    it("Should reset moderators", async function () {
      const { graviDAO, owner, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Nominate a moderator
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Reset moderators
      await graviDAO.connect(owner).resetModerators();
      
      // Verify reset
      const moderatorCount = await graviDAO.getNominatedModeratorCount();
      expect(moderatorCount).to.equal(0);
      
      const nomination = await graviDAO.nominatedModerators(user2.address);
      expect(nomination.moderator).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Reward Systems", function () {
    it("Should set moderator reward amounts", async function () {
      const { graviDAO, owner } = await loadFixture(deployDAOFixture);
      
      const newNominationReward = ethers.parseEther("0.1");
      const newVotingReward = ethers.parseEther("0.05");
      
      await graviDAO.connect(owner).setModeratorRewardAmounts(
        newNominationReward,
        newVotingReward
      );
      
      const [enabled, nominationReward, votingReward] = await graviDAO.getModeratorRewardInfo();
      expect(enabled).to.be.true;
      expect(nominationReward).to.equal(newNominationReward);
      expect(votingReward).to.equal(newVotingReward);
    });
    
    it("Should reward users for nominating moderators", async function () {
      const { graviDAO, graviCha, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Get initial balance
      const initialBalance = await graviCha.balanceOf(user1.address);
      
      // Nominate a moderator
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Check if reward was given
      const finalBalance = await graviCha.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
    
    it("Should reward users for voting for moderators", async function () {
      const { graviDAO, graviCha, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Nominate first
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Get initial balance
      const initialBalance = await graviCha.balanceOf(user3.address);
      
      // Vote
      await graviDAO.connect(user3).voteForModerator(user2.address);
      
      // Check if reward was given
      const finalBalance = await graviCha.balanceOf(user3.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Governance and Authorization", function () {
    it("Should set timelock controller correctly", async function () {
      const { graviDAO, owner, user1 } = await loadFixture(deployDAOFixture);
      
      await graviDAO.connect(owner).setTimelockController(user1.address);
      
      expect(await graviDAO.timelockController()).to.equal(user1.address);
    });
    
    it("Should only allow owner or timelock to call governance functions", async function () {
      const { graviDAO, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Set user1 as timelock controller
      await graviDAO.connect(await ethers.getSigner(await graviDAO.owner())).setTimelockController(user1.address);
      
      // User with governance rights (timelock) should be able to call
      await graviDAO.connect(user1).toggleModeratorRewards(false);
      
      // Non-governance user should not be able to call
      await expect(graviDAO.connect(user2).toggleModeratorRewards(true))
        .to.be.revertedWith("Unauthorized: not governance");
    });
  });
});
