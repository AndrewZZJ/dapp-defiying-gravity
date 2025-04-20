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

    // Deploy GraviDisasterOracle (GraviOracle)
    const GraviOracle = await ethers.getContractFactory("GraviDisasterOracle");
    const graviOracle = await GraviOracle.deploy();
    await graviOracle.waitForDeployment();
    const graviOracleAddress = await graviOracle.getAddress();

    // Deploy NFT pool
    const GraviPoolNFTFactory = await ethers.getContractFactory("GraviPoolNFT");
    const graviPoolNFT = await GraviPoolNFTFactory.deploy(await graviCha.getAddress());
    
    // Deploy mock insurance
    const GraviInsuranceFactory = await ethers.getContractFactory("GraviInsurance");
    const mockInsurance = await GraviInsuranceFactory.deploy(
      "flood", // disaster type
      ethers.parseEther("5"), // premium
      await graviCha.getAddress(),
      graviOracleAddress
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

  describe("Treasury and ETH Management", function () {
    it("Should allow moving ETH from insurance pool", async function () {
      const { graviDAO, mockInsurance, graviPoolNFT, owner, user1 } = await loadFixture(deployDAOFixture);
      
      // First set the NFT pool and add insurance pool
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      const poolName = "Flood Insurance";
      await graviDAO.connect(owner).addInsurancePool(poolName, await mockInsurance.getAddress());
      
      // Send ETH to the insurance contract
      await owner.sendTransaction({
        to: await mockInsurance.getAddress(),
        value: ethers.parseEther("5")
      });
      
      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Move ETH from insurance to user1
      await graviDAO.connect(owner).moveEtherFromInsurance(
        poolName,
        user1.address,
        ethers.parseEther("1")
      );
      
      // Verify the balance change
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Monthly NFT Minting", function () {
    it("Should mint NFTs for an insurance pool", async function () {
      const { graviDAO, mockInsurance, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      // First set the NFT pool and add insurance pool
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      const poolName = "Flood Insurance";
      await graviDAO.connect(owner).addInsurancePool(poolName, await mockInsurance.getAddress());
      
      // Set up the NFT pool mock functionality
      // For this test, we'll just verify the call doesn't revert
      // In a more comprehensive test, you would mock the NFT pool's behavior
      
      // Call the monthly mint function
      const tokenURIs = ["ipfs://token1", "ipfs://token2"];
      await graviDAO.connect(owner).monthlyMintNFTForPool(poolName, tokenURIs);
      
      // Basic verification - since we don't have a way to directly verify the NFT mint
      // We could add more specific assertions if we had access to the NFT contract events
    });
    
    it("Should revert when minting NFTs for non-existent pool", async function () {
      const { graviDAO, graviPoolNFT, owner } = await loadFixture(deployDAOFixture);
      
      // Set the NFT pool but don't add any insurance pools
      await graviDAO.connect(owner).setNFTPool(await graviPoolNFT.getAddress());
      
      // Attempt to mint for a non-existent pool
      const tokenURIs = ["ipfs://token1"];
      await expect(graviDAO.connect(owner).monthlyMintNFTForPool(
        "Non-existent Pool", 
        tokenURIs
      )).to.be.revertedWith("Insurance pool not found");
    });
  });

  describe("Monthly Governance Token Operations", function () {
    it("Should mint monthly gov tokens", async function () {
      const { graviDAO, graviGov, owner } = await loadFixture(deployDAOFixture);
      
      // Set monthly mint amount
      const monthlyAmount = ethers.parseEther("1000");
      await graviDAO.connect(owner).setMonthlyGovMintAmount(monthlyAmount);
      
      // Get initial balance
      const initialBalance = await graviGov.balanceOf(await graviDAO.getAddress());
      
      // Call monthly mint
      await graviDAO.connect(owner).monthlyMintGovTokens();
      
      // Verify balance increased by the monthly amount
      const finalBalance = await graviGov.balanceOf(await graviDAO.getAddress());
      expect(finalBalance - initialBalance).to.equal(monthlyAmount);
    });
    
    it("Should set monthly gov mint amount", async function () {
      const { graviDAO, graviGov, owner } = await loadFixture(deployDAOFixture);
      
      const newAmount = ethers.parseEther("2000");
      await graviDAO.connect(owner).setMonthlyGovMintAmount(newAmount);
      
      // Call monthly mint to verify the new amount is used
      await graviDAO.connect(owner).monthlyMintGovTokens();
      
      // Check DAO received the correct amount
      // This is a basic test that assumes the DAO contract's balance increases by the set amount
      // A more comprehensive test would track exact balance changes
    });
  });

  describe("Governance Token Purchases Edge Cases", function () {
    it("Should handle zero token purchase correctly", async function () {
      const { graviDAO, user1 } = await loadFixture(deployDAOFixture);
      
      // Attempt to calculate price for zero tokens
      const [ethPrice, chaPrice] = await graviDAO.calculatesGovTokenPurchasePrice(0);
      
      // Both prices should be zero
      expect(ethPrice).to.equal(0);
      expect(chaPrice).to.equal(0);
    });
    
    it("Should refund excess ETH when purchasing tokens", async function () {
      const { graviDAO, graviCha, graviGov, user1 } = await loadFixture(deployDAOFixture);
      
      // Approve GraviCha tokens for burning
      await graviCha.connect(user1).approve(await graviDAO.getAddress(), ethers.parseEther("100"));
      
      // Get initial balances
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const amount = ethers.parseEther("1");
      
      // Purchase with excess ETH
      const requiredEth = ethers.parseEther("0.01"); // 1 token costs 0.01 ETH
      const excessEth = ethers.parseEther("0.02"); // Sending 0.02 ETH (0.01 excess)
      
      // Make the purchase
      await graviDAO.connect(user1).purchaseGovTokens(amount, {
        value: excessEth
      });
      
      // Calculate expected balance change (accounting for gas)
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // The user should have spent approximately 0.01 ETH (plus gas fees)
      // In a perfect world without gas fees, finalBalance would be initialBalance - requiredEth
      // But we need to account for gas, so we just verify the difference is less than the excess amount
      expect(initialBalance - finalBalance).to.be.lessThan(excessEth);
    });
    
    it("Should revert when not enough gov tokens in pool", async function () {
      const { graviDAO, graviCha, graviGov, user1 } = await loadFixture(deployDAOFixture);
      
      // Get the current balance of governance tokens in the DAO
      const daoBalance = await graviGov.balanceOf(await graviDAO.getAddress());
      
      // Approve GraviCha tokens for burning
      await graviCha.connect(user1).approve(await graviDAO.getAddress(), ethers.parseEther("10000"));
      
      // Attempt to purchase more tokens than are available in the DAO
      // Adding 1 to ensure we're requesting more than what's available
      const moreThanAvailable = daoBalance + 1n;
      
      await expect(graviDAO.connect(user1).purchaseGovTokens(
        moreThanAvailable, 
        { value: ethers.parseEther("100") } // Sending enough ETH to cover the purchase
      )).to.be.revertedWith("Not enough governance tokens in pool");
    });
  });

  describe("Comprehensive Moderator System Tests", function () {
    it("Should require minimum token balance for nominating moderators", async function () {
      const { graviDAO, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Set a high nomination threshold
      const highThreshold = ethers.parseEther("10000");
      await graviDAO.connect(await ethers.getSigner(await graviDAO.owner())).setModeratorThresholds(
        highThreshold,
        ethers.parseEther("1")
      );
      
      // Try to nominate with insufficient tokens
      await expect(graviDAO.connect(user1).nominateModerator(user2.address))
        .to.be.revertedWith("Insufficient governance tokens");
    });
    
    it("Should require minimum token balance for voting", async function () {
      const { graviDAO, user1, user2, user3, owner } = await loadFixture(deployDAOFixture);
      
      // First nominate a moderator
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Set a high voting threshold
      const highVotingThreshold = ethers.parseEther("10000");
      await graviDAO.connect(owner).setModeratorThresholds(
        ethers.parseEther("100"),
        highVotingThreshold
      );
      
      // Create a user with no tokens
      const [newUser] = await ethers.getSigners();
      
      // Try to vote with insufficient tokens
      await expect(graviDAO.connect(newUser).voteForModerator(user2.address))
        .to.be.revertedWith("Insufficient governance tokens");
    });
    
    it("Should prevent nominating zero address", async function () {
      const { graviDAO, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(graviDAO.connect(user1).nominateModerator(ethers.ZeroAddress))
        .to.be.revertedWith("Cannot nominate zero address");
    });
    
    it("Should prevent double nomination", async function () {
      const { graviDAO, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Nominate once
      await graviDAO.connect(user1).nominateModerator(user2.address);
      
      // Try to nominate again
      await expect(graviDAO.connect(user1).nominateModerator(user2.address))
        .to.be.revertedWith("Already nominated");
    });
    
    it("Should get all nominated moderator data", async function () {
      const { graviDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Nominate two moderators
      await graviDAO.connect(user1).nominateModerator(user2.address);
      await graviDAO.connect(user3).nominateModerator(user1.address);
      
      // Get all data
      const [moderators, votes, nominators] = await graviDAO.getAllNominatedModerators();
      
      // Verify the data
      expect(moderators.length).to.equal(2);
      expect(moderators).to.include(user2.address);
      expect(moderators).to.include(user1.address);
      expect(nominators).to.include(user1.address);
      expect(nominators).to.include(user3.address);
    });
    
    it("Should check if address is a top moderator", async function () {
      const { graviDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Nominate moderators
      await graviDAO.connect(user1).nominateModerator(user2.address);
      await graviDAO.connect(user1).nominateModerator(user3.address);
      
      // Vote for one moderator to make them top
      await graviDAO.connect(user2).voteForModerator(user3.address);
      await graviDAO.connect(user3).voteForModerator(user3.address);
      
      // Check top status
      const [isTop, rank] = await graviDAO.isTopModerator(user3.address, 1);
      expect(isTop).to.be.true;
      expect(rank).to.equal(1);
      
      // Check non-top
      const [isTopUser2] = await graviDAO.isTopModerator(user2.address, 1);
      expect(isTopUser2).to.be.false;
    });
  });

  describe("Governance Authorization Edge Cases", function () {
    it("Should allow timelock to call governance functions", async function () {
      const { graviDAO, owner, user1, user2 } = await loadFixture(deployDAOFixture);
      
      // Set timelock controller to user1
      await graviDAO.connect(owner).setTimelockController(user1.address);
      
      // Verify user1 can call governance functions
      await graviDAO.connect(user1).setModeratorThresholds(
        ethers.parseEther("200"),
        ethers.parseEther("50")
      );
      
      // Verify the thresholds were updated
      expect(await graviDAO.moderatorNominationThreshold()).to.equal(ethers.parseEther("200"));
      expect(await graviDAO.moderatorVotingThreshold()).to.equal(ethers.parseEther("50"));
    });
    
    it("Should revert when setting zero address as timelock", async function () {
      const { graviDAO, owner } = await loadFixture(deployDAOFixture);
      
      await expect(graviDAO.connect(owner).setTimelockController(ethers.ZeroAddress))
        .to.be.revertedWith("Timelock address cannot be zero");
    });
  });
});
