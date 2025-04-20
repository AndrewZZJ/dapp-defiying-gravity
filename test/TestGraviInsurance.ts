// AJ: Great! At least one unit test working!

import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviInsurance, GraviCha } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

async function deployGraviInsuranceFixture() {
  const [owner, minter, user, customer] = await ethers.getSigners();
  const GraviChaFactory = await ethers.getContractFactory("GraviCha");
  const graviCha = (await GraviChaFactory.deploy()) as GraviCha;
  const GraviInsuranceFactory = await ethers.getContractFactory("GraviInsurance");

  // Deploy GraviDisasterOracle (GraviOracle)
  const GraviOracle = await ethers.getContractFactory("GraviDisasterOracle");
  const graviOracle = await GraviOracle.deploy();
  await graviOracle.waitForDeployment();
  const graviOracleAddress = await graviOracle.getAddress();

  // Change the disaster type from "FireInsurance" to "FIRE" to match oracle's whitelist
  const graviInsurance = (await GraviInsuranceFactory.deploy("FIRE", 100, graviCha, graviOracleAddress)) as GraviInsurance;
  await graviInsurance.waitForDeployment();
  return { graviInsurance, graviCha, graviOracle, owner, minter, user, customer };
}

// Helper function to safely extract policy ID from receipt
async function extractPolicyIdFromReceipt(graviInsurance: GraviInsurance, receipt: any): Promise<string> {
  // Update with proper typing for log parameter
  const event = receipt?.logs?.find((log: { topics: string[]; data: string }) => {
    try {
      const parsedLog = graviInsurance.interface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });
      return parsedLog?.name === "PolicyPurchased";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsedEvent = graviInsurance.interface.parseLog({
      topics: event.topics as string[],
      data: event.data
    });
    return parsedEvent?.args?.[1]; // The second arg should be the policyId
  } else {
    throw new Error("PolicyPurchased event not found in transaction receipt");
  }
}

describe("GraviInsurance contract", function () {
  describe("Test 1: buying insurance policies", function () {
    it("should allow a user to buy a policy with correct ETH", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";

      // Step 1: Calculate the expected premium from the contract
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const transaction = await graviInsurance.connect(user).buyInsurance(now_time, coverageDays, propertyAddress, propertyValue, { value: premium });
      // 1. Expect event
      await expect(transaction).to.emit(graviInsurance, "PolicyPurchased")
      .withArgs(
        user.address,
        anyValue,
        propertyValue,
        premium,
        now_time,
        now_time + coverageDays * 24 * 60 * 60
      );

      // 2. Get policyId from receipt using helper function
      const receipt = await transaction.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);

      // 3. Verify policy from contract storage
      const policy = await graviInsurance.policies(policyId);
      expect(policy.policyHolder).to.equal(user.address);
      expect(policy.propertyValue).to.equal(propertyValue);
      expect(policy.premiumPaid).to.equal(premium);
    });

    it("should revert if we got wrong premium", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";

      await expect(
        graviInsurance.connect(user).buyInsurance(now_time, coverageDays, propertyAddress, propertyValue, {
          value: ethers.parseEther("20"),
        })
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("should revert if property value is 0", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("0");
      const propertyAddress = "123 Maple St";
      // propertyValue is 0, so premium should be 0
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);

      await expect(
        graviInsurance.connect(user).buyInsurance(now_time, coverageDays, propertyAddress, propertyValue, {
          value: premium,
        })
      ).to.be.revertedWith("Premium must be greater than 0");
    });
  });

  describe("Test 2: filing claims", function () {
    it("should allow user to file a claim", async () => {
      const { graviInsurance, user, owner } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Calculate premium and buy insurance
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const transaction = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await transaction.wait();
      
      // Extract policyId using helper function
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add a disaster event
      const eventName = "Test Flood 2024";
      const eventDescription = "Severe flooding in the test area";
      await graviInsurance.connect(owner).addDisasterEvent(
        eventName,
        eventDescription,
        now_time
      );
      
      // Get the eventId - for this test we know it will be "EVT#1" based on contract logic
      const eventId = "EVT#1";
      
      // Start a claim
      const incidentDescription = "Water damage in basement";
      await expect(
        graviInsurance.connect(user).startAClaim(eventId, policyId, incidentDescription)
      ).to.emit(graviInsurance, "ClaimStarted")
        .withArgs(anyValue, incidentDescription);
    });
    
    it("should reject claim for non-existent event", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Buy insurance
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Try to file claim with non-existent event
      await expect(
        graviInsurance.connect(user).startAClaim("NonExistentEvent", policyId, "Water damage")
      ).to.be.revertedWith("Event does not exist");
    });
  });

  describe("Test 3: Moderator Actions", () => {
    it("should allow owner to add a moderator", async () => {
      const { graviInsurance, owner, minter } = await loadFixture(deployGraviInsuranceFixture);
      
      const maxAmount = ethers.parseEther("5");
      await expect(
        graviInsurance.connect(owner).addModeratorToPool(minter.address, maxAmount)
      ).to.emit(graviInsurance, "ModeratorAdded")
        .withArgs(minter.address, maxAmount);
    });
    
    it("should allow a moderator to assess a claim", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Buy insurance
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderator
      const maxAmount = ethers.parseEther("5");
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, maxAmount);
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Assess claim
      const approvedAmount = ethers.parseEther("3");
      await expect(
        graviInsurance.connect(minter).assessClaim(1, true, approvedAmount)
      ).to.emit(graviInsurance, "ClaimAssessed")
        .withArgs(minter.address, 1, true, approvedAmount);
    });
    
    it("should reject assessment from non-moderator", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Try to assess claim as non-moderator
      await expect(
        graviInsurance.connect(user).assessClaim(1, true, ethers.parseEther("1"))
      ).to.be.revertedWith("Not a registered moderator");
    });
  });

  describe("Test 4: Claim Processing and Payout", () => {
    it("should process a claim when enough moderators have assessed", async () => {
      const { graviInsurance, graviOracle, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Assessments from 3 moderators
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, true, ethers.parseEther("4"));
      await graviInsurance.connect(owner).assessClaim(1, false, 0); // One moderator rejects
      
      // Process claim - should verify return from validateClaim in the oracle
      // We know it will return true for "FIRE"
      await expect(
        graviInsurance.connect(owner).processClaim(1)
      ).to.emit(graviInsurance, "ClaimProcessed");
      
      // Verify the claim status is Accepted
      const [claimId, , , approvedAmount, , , status] = await graviInsurance.getClaimDetails(1);
      expect(claimId).to.equal(1);
      expect(status).to.equal("Accepted");
      expect(approvedAmount).to.equal(ethers.parseEther("4.5")); // Average of 5 and 4
    });
    
    it("should allow owner to payout an approved claim", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Add ETH to the insurance contract first to ensure there are funds for payout
      await owner.sendTransaction({
        to: await graviInsurance.getAddress(),
        value: ethers.parseEther("10")  // Send 10 ETH to the contract
      });
      
      // Buy insurance
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Assessments from 3 moderators (all approve)
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(owner).assessClaim(1, true, ethers.parseEther("5"));
      
      // Process claim - using the correct disaster type "FIRE"
      await graviInsurance.connect(owner).processClaim(1);
      
      // Check user balance before payout
      const balanceBefore = await ethers.provider.getBalance(user.address);
      
      // Payout claim
      await expect(
        graviInsurance.connect(owner).payoutClaim(1)
      ).to.emit(graviInsurance, "ClaimApproved");
      
      // Verify user received payment
      const balanceAfter = await ethers.provider.getBalance(user.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("5"));
    });
  });

  describe("Test 5: Data Retrieval for both buy an insurance and send a claim", () => {
    it("should return correct data after user bought one policy", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      await graviInsurance.connect(user).buyInsurance(now_time, coverageDays, propertyAddress, propertyValue, { value: premium });

      const [
        policyIds,
        policyHolders,
        maxCoverageAmounts,
        premiums,
        startTimes,
        endTimes,
        isClaimedList,
        propertyAddresses,
        propertyValues
      ] = await graviInsurance.connect(user).getUserPolicies();
      
      expect(policyIds.length).to.equal(1);
      expect(policyHolders[0]).to.equal(user.address);
      expect(propertyAddresses[0]).to.equal(propertyAddress);
      expect(propertyValues[0]).to.equal(propertyValue);
      expect(premiums[0]).to.equal(premium);
    });

    it("should return user's insurance IDs", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy multiple policies
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      
      // Calculate premium for EACH property address separately
      const propertyAddress1 = "123 Main St";
      const premium1 = await graviInsurance.calculatePremium(propertyAddress1, propertyValue, coverageDays);
      
      await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress1, propertyValue, { value: premium1 }
      );
      
      const propertyAddress2 = "456 Oak Ave";
      const premium2 = await graviInsurance.calculatePremium(propertyAddress2, propertyValue, coverageDays);
      
      await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress2, propertyValue, { value: premium2 }
      );
      
      // Get user's policy IDs
      const policyIds = await graviInsurance.fetchInsuranceIds(user.address);
      
      // Verify the correct number of policies
      expect(policyIds.length).to.equal(2);
    });
  });

  describe("Test 6: Disaster Events Management", () => {
    it("should allow owner to add a disaster event", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      await expect(
        graviInsurance.connect(owner).addDisasterEvent(
          "Hurricane Alex",
          "Category 3 hurricane affecting coastal areas",
          now_time
        )
      ).to.emit(graviInsurance, "DisasterEventAdded")
        .withArgs("EVT#1");
      
      // Verify the event was added correctly
      const [name, description, eventDate] = await graviInsurance.getDisasterEvent("EVT#1");
      expect(name).to.equal("Hurricane Alex");
      expect(description).to.equal("Category 3 hurricane affecting coastal areas");
      expect(eventDate).to.equal(now_time);
    });
    
    it("should allow owner to modify a disaster event", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // First add an event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Initial Event",
        "Initial description",
        now_time
      );
      
      // Then modify it
      const newTime = now_time + 3600; // 1 hour later
      await expect(
        graviInsurance.connect(owner).modifyDisasterEvent(
          "EVT#1",
          "Updated Event",
          "Updated description",
          newTime
        )
      ).to.emit(graviInsurance, "DisasterEventModified");
      
      // Verify the changes
      const [name, description, eventDate] = await graviInsurance.getDisasterEvent("EVT#1");
      expect(name).to.equal("Updated Event");
      expect(description).to.equal("Updated description");
      expect(eventDate).to.equal(newTime);
    });
    
    it("should allow owner to remove a disaster event", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // First add an event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Event to Remove",
        "This event will be removed",
        now_time
      );
      
      // Then remove it
      await expect(
        graviInsurance.connect(owner).removeDisasterEvent("EVT#1")
      ).to.emit(graviInsurance, "DisasterEventRemoved");
      
      // Verify it was removed by trying to get it (should revert)
      await expect(
        graviInsurance.getDisasterEvent("EVT#1")
      ).to.be.revertedWith("Event does not exist");
    });
  });

  describe("Test 7: Donation Functionality", () => {
    it("should allow users to donate ETH and receive charity tokens", async () => {
      const { graviInsurance, user, graviCha, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Make sure graviCha is properly initialized - fix the assertion
      expect(graviCha).to.exist;  // Changed from to.not.be.undefined
      
      // Set up graviCha as a minter - use owner to add the insurance contract as a minter
      await graviCha.connect(owner).addMinter(await graviInsurance.getAddress());
      
      // Set donation reward rate
      await graviInsurance.setDonationRewardRate(5000); // 5000 tokens per ETH
      
      // Get initial balances
      const initialPoolFunds = await graviInsurance.totalPoolFunds();
      const initialTokenBalance = await graviCha.balanceOf(user.address);
      
      // Donate 1 ETH
      const donationAmount = ethers.parseEther("1");
      await expect(
        graviInsurance.connect(user).donate({ value: donationAmount })
      ).to.emit(graviInsurance, "FundsDonated")
        .withArgs(user.address, donationAmount);
      
      // Verify pool funds increased
      const finalPoolFunds = await graviInsurance.totalPoolFunds();
      expect(finalPoolFunds - initialPoolFunds).to.equal(donationAmount);
      
      // Verify user received charity tokens
      const finalTokenBalance = await graviCha.balanceOf(user.address);
      expect(finalTokenBalance - initialTokenBalance).to.equal(donationAmount * 5000n);
    });
    
    it("should track top donors correctly", async () => {
      const { graviInsurance, user, customer, minter, graviCha, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Make sure graviCha is properly initialized - fix the assertion
      expect(graviCha).to.exist;  // Changed from to.not.be.undefined
      
      // Set up graviCha as a minter - use owner to add the insurance contract as a minter
      await graviCha.connect(owner).addMinter(await graviInsurance.getAddress());
      
      // Make multiple donations
      await graviInsurance.connect(user).donate({ value: ethers.parseEther("2") });
      await graviInsurance.connect(customer).donate({ value: ethers.parseEther("3") });
      await graviInsurance.connect(minter).donate({ value: ethers.parseEther("1") });
      
      // Get top donors
      const [topDonors, topAmounts] = await graviInsurance.getTopDonors();
      
      // Verify the order (should be customer, user, minter)
      expect(topDonors[0]).to.equal(customer.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("3"));
      
      expect(topDonors[1]).to.equal(user.address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("2"));
      
      expect(topDonors[2]).to.equal(minter.address);
      expect(topAmounts[2]).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Test 8: Policy Validation & Expiration", () => {
    it("should correctly track policy expiration status", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      
      // Get current time
      const now_time = Math.floor(Date.now() / 1000);
      
      // Create a policy that expires in 1 day
      const shortCoverageDays = 1;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, shortCoverageDays);
      
      await graviInsurance.connect(user).buyInsurance(
        now_time, shortCoverageDays, propertyAddress, propertyValue, { value: premium }
      );
      
      // Get policy details
      const [
        policyIds,
        ,
        ,
        ,
        startTimes, 
        endTimes,
        ,
        ,
      ] = await graviInsurance.connect(user).getUserPolicies();
      
      // Verify the policy expiration time is correct (1 day from now)
      const expectedEndTime = startTimes[0] + BigInt(shortCoverageDays * 24 * 60 * 60);
      expect(endTimes[0]).to.equal(expectedEndTime);
    });
    
    it("should calculate different premiums based on property address", async () => {
      const { graviInsurance } = await loadFixture(deployGraviInsuranceFixture);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      
      // Calculate premiums for different addresses
      const premium1 = await graviInsurance.calculatePremium("123 Maple St", propertyValue, coverageDays);
      const premium2 = await graviInsurance.calculatePremium("456 Oak Ave", propertyValue, coverageDays);
      
      // Premiums should be different due to the address factor
      expect(premium1).to.not.equal(premium2);
    });

    it("should update test for calculate coverage amount based on property details", async () => {
      const { graviInsurance, graviOracle } = await loadFixture(deployGraviInsuranceFixture);
      
      const propertyAddress = "123 Maple St";
      const propertyValue = ethers.parseEther("20");
      const coverageDays = 30;
      
      // Test that the new function works correctly
      const coverageAmount = await graviInsurance.calculateCoverageAmount(
        propertyAddress, 
        propertyValue, 
        coverageDays
      );
      
      // Verify it matches the oracle's calculation
      const expectedCoverage = await graviOracle.calculateCoverage(
        propertyAddress, 
        propertyValue, 
        coverageDays
      );
      
      expect(coverageAmount).to.equal(expectedCoverage);
    });
  });

  describe("Test 9: Moderator Management", () => {
    it("should allow owner to modify a moderator's maximum approval amount", async () => {
      const { graviInsurance, owner, minter } = await loadFixture(deployGraviInsuranceFixture);
      
      // First add a moderator
      const initialMaxAmount = ethers.parseEther("5");
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, initialMaxAmount);
      
      // Then remove the moderator
      await graviInsurance.connect(owner).removeModeratorFromPool(minter.address);
      
      // Re-add the moderator with a different amount
      const newMaxAmount = ethers.parseEther("10");
      await expect(
        graviInsurance.connect(owner).addModeratorToPool(minter.address, newMaxAmount)
      ).to.emit(graviInsurance, "ModeratorAdded")
        .withArgs(minter.address, newMaxAmount);
    });

    it("should prevent non-owners from adding moderators", async () => {
      const { graviInsurance, user, customer } = await loadFixture(deployGraviInsuranceFixture);
      
      // User (non-owner) tries to add a moderator
      await expect(
        graviInsurance.connect(user).addModeratorToPool(customer.address, ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(graviInsurance, "OwnableUnauthorizedAccount");
    });
    
    it("should prevent non-owners from removing moderators", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      
      // First add a moderator as owner
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("5"));
      
      // User (non-owner) tries to remove the moderator
      await expect(
        graviInsurance.connect(user).removeModeratorFromPool(minter.address)
      ).to.be.revertedWithCustomError(graviInsurance, "OwnableUnauthorizedAccount");
    });
  });

  describe("Test 10: Claim Constraints", () => {
    it("should not allow claims on expired policies", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 2); // 2 days ago
      const coverageDays = 1; // 1 day coverage (now expired)
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Calculate premium and buy insurance with start time 2 days ago and 1 day coverage
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add a disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Try to file a claim on the expired policy
      await expect(
        graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Damage after policy expired")
      ).to.be.revertedWith("Policy has expired");
    });
    
    it("should not allow non-policy holders to file claims", async () => {
      const { graviInsurance, owner, user, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Buy insurance as user
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add a disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Customer (not the policy holder) tries to file a claim
      await expect(
        graviInsurance.connect(customer).startAClaim("EVT#1", policyId, "Trying to claim someone else's policy")
      ).to.be.revertedWith("Not the policy holder");
    });

    it("should prevent filing multiple claims on the same policy", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event and file first claim
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // First claim should succeed
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "First claim");
      
      // Add 3 moderators and let them all assess the claim
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("100"));
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("100"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("100"));
      
      await graviInsurance.connect(owner).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, true, ethers.parseEther("5"));
      
      // Mark the policy as claimed
      await graviInsurance.connect(owner).processClaim(1);
      
      // Fund the contract so it can make the payout
      await owner.sendTransaction({
        to: await graviInsurance.getAddress(),
        value: ethers.parseEther("10")
      });
      
      await graviInsurance.connect(owner).payoutClaim(1);
      
      // Second claim should be rejected because policy is already claimed
      await expect(
        graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Second claim")
      ).to.be.revertedWith("Policy already claimed");
    });
  });

  describe("Test 11: Coverage Amount Calculation", () => {
    it("should calculate coverage amount based on property details", async () => {
      const { graviInsurance, graviOracle } = await loadFixture(deployGraviInsuranceFixture);
      
      const propertyAddress = "123 Maple St";
      const propertyValue = ethers.parseEther("20");
      const coverageDays = 30;
      
      // Get coverage amount from insurance contract
      const coverageAmount = await graviInsurance.calculateCoverageAmount(
        propertyAddress, 
        propertyValue, 
        coverageDays
      );
      
      // Verify it's calling the oracle's implementation
      const expectedCoverage = await graviOracle.calculateCoverage(
        propertyAddress, 
        propertyValue, 
        coverageDays
      );
      
      expect(coverageAmount).to.equal(expectedCoverage);
      
      // Coverage should be proportional to property value
      expect(coverageAmount).to.be.gt(0);
      // Coverage should be at most 80% of property value per our implementation
      expect(coverageAmount).to.be.lte(propertyValue * 80n / 100n);
    });
    
    it("should calculate different coverage for different properties", async () => {
      const { graviInsurance } = await loadFixture(deployGraviInsuranceFixture);
      
      // Use very distinct property addresses to guarantee different hash values
      const propertyAddress1 = "123 Main Street, Anytown, New York, USA, 10001, Apartment 45B";
      const propertyAddress2 = "789 Ocean Boulevard, Beachville, California, USA, 90210, Suite 12C";
      const propertyValue = ethers.parseEther("20");
      const coverageDays = 30;
      
      const coverage1 = await graviInsurance.calculateCoverageAmount(
        propertyAddress1, 
        propertyValue, 
        coverageDays
      );
      
      const coverage2 = await graviInsurance.calculateCoverageAmount(
        propertyAddress2, 
        propertyValue, 
        coverageDays
      );
      
      // console.log("Coverage 1:", coverage1.toString());
      // console.log("Coverage 2:", coverage2.toString());
      
      // Different addresses should produce different coverage amounts
      expect(coverage1).to.not.equal(coverage2);
    });
    
    it("should use the calculateCoverageAmount when buying insurance", async () => {
      const { graviInsurance, user, graviOracle } = await loadFixture(deployGraviInsuranceFixture);
      
      const now_time = Math.floor(Date.now() / 1000);
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      
      // Calculate expected values
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      const expectedCoverage = await graviOracle.calculateCoverage(propertyAddress, propertyValue, coverageDays);
      
      // Buy insurance
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Check that the coverage amount matches what we expect from calculateCoverageAmount
      const policy = await graviInsurance.policies(policyId);
      expect(policy.maxCoverageAmount).to.equal(expectedCoverage);
    });
  });

  describe("Test 12: Error Handling", () => {
    it("should reject assessments when claim is already processed", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // All moderators assess the claim
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(owner).assessClaim(1, true, ethers.parseEther("5"));
      
      // Process claim
      await graviInsurance.connect(owner).processClaim(1);
      
      // Try to assess after processing - should fail
      await expect(
        graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"))
      ).to.be.revertedWith("Claim already processed");
    });
    
    it("should reject assessment with zero amount on approval", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderator
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Try to approve with zero amount
      await expect(
        graviInsurance.connect(minter).assessClaim(1, true, 0)
      ).to.be.revertedWith("Approval amount must be greater than zero");
    });
    
    it("should reject assessment exceeding moderator cap", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderator with a 5 ETH cap
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("5"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Try to approve with amount exceeding cap
      await expect(
        graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("6"))
      ).to.be.revertedWith("Amount exceeds moderator cap");
    });
    
    it("should revert when payout called for an unaccepted claim", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up policy and claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Try to payout without processing - should fail
      await expect(
        graviInsurance.connect(owner).payoutClaim(1)
      ).to.be.revertedWith("Claim not accepted");
    });
    
    it("should validate invalid claim ID for getClaimDetails", async () => {
      const { graviInsurance } = await loadFixture(deployGraviInsuranceFixture);
      
      // Try to get claim details for non-existent claim
      await expect(
        graviInsurance.getClaimDetails(999)
      ).to.be.revertedWith("Invalid claim ID");
    });
  });

  describe("Test 13: Fund Management", () => {
    it("should receive ETH through the receive function", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Get initial pool funds
      const initialPoolFunds = await graviInsurance.totalPoolFunds();
      
      // Send ETH directly to contract
      await owner.sendTransaction({
        to: await graviInsurance.getAddress(),
        value: ethers.parseEther("1")
      });
      
      // Check pool funds increased
      const finalPoolFunds = await graviInsurance.totalPoolFunds();
      expect(finalPoolFunds - initialPoolFunds).to.equal(ethers.parseEther("1"));
    });
    
    it("should reject transfer if contract has insufficient funds", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Try to transfer more than contract has
      await expect(
        graviInsurance.connect(owner).transferEther(owner.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("should not mint charity tokens if donation is zero", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      
      // Try to donate 0 ETH
      await expect(
        graviInsurance.connect(user).donate({ value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });
    
    it("should revert on invalid donation reward rate", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Try to set invalid rate
      await expect(
        graviInsurance.connect(owner).setDonationRewardRate(0)
      ).to.be.revertedWith("Invalid rate");
    });
  });

  describe("Test 14: Advanced Claim Processing", () => {
    it("should process a claim with exactly 3 moderators", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Add ETH to the insurance contract
      await owner.sendTransaction({
        to: await graviInsurance.getAddress(),
        value: ethers.parseEther("10")
      });
      
      // Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add exactly 3 moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Assessments with different approval outcomes (2 approve, 1 deny)
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, true, ethers.parseEther("6"));
      await graviInsurance.connect(owner).assessClaim(1, false, 0);
      
      // Process claim
      await graviInsurance.connect(owner).processClaim(1);
      
      // Verify claim status and amount (should be accepted with average of 5.5 ETH)
      const [claimId, _, __, approvedAmount, ___, ____, status] = await graviInsurance.getClaimDetails(1);
      expect(status).to.equal("Accepted");
      expect(approvedAmount).to.equal(ethers.parseEther("5.5")); // Average of 5 and 6
    });
    
    it("should reject a claim with majority denial votes", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add exactly 3 moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Assessments with majority deny (1 approve, 2 deny)
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, false, 0);
      await graviInsurance.connect(owner).assessClaim(1, false, 0);
      
      // Process claim
      await graviInsurance.connect(owner).processClaim(1);
      
      // Verify claim status (should be denied)
      const [claimId, _, __, approvedAmount, ___, ____, status] = await graviInsurance.getClaimDetails(1);
      expect(status).to.equal("Denied");
      expect(approvedAmount).to.equal(0);
    });
    
    it("should revert process claim if fewer than 3 moderators assessed", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add only 2 moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(owner.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Only 2 assessments
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(owner).assessClaim(1, true, ethers.parseEther("6"));
      
      // Try to process claim - should revert
      await expect(
        graviInsurance.connect(owner).processClaim(1)
      ).to.be.revertedWith("Not enough moderators have assessed this claim");
    });
    
    it("should prevent moderator from assessing the same claim twice", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderator
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // First assessment
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      
      // Try to assess again
      await expect(
        graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("6"))
      ).to.be.revertedWith("Already assessed");
    });
  });

  describe("Test 15: Comprehensive Data Retrieval", () => {
    it("should retrieve all disaster events", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Add multiple disaster events
      await graviInsurance.connect(owner).addDisasterEvent(
        "Event 1",
        "Description 1",
        now_time
      );
      
      await graviInsurance.connect(owner).addDisasterEvent(
        "Event 2",
        "Description 2",
        now_time + 1000
      );
      
      // Get all events
      const eventIds = await graviInsurance.getAllDisasterEvents();
      
      // Verify the correct number of events
      expect(eventIds.length).to.equal(2);
      expect(eventIds[0]).to.equal("EVT#1");
      expect(eventIds[1]).to.equal("EVT#2");
    });
    
    it("should return user's insurance IDs", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy multiple policies
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const premium1 = await graviInsurance.calculatePremium("123 Main St", propertyValue, coverageDays);
      
      await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, "123 Main St", propertyValue, { value: premium1 }
      );

      const premium2 = await graviInsurance.calculatePremium("456 Oak Ave", propertyValue, coverageDays);

      await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, "456 Oak Ave", propertyValue, { value: premium2 }
      );
      
      // Get user's policy IDs
      const policyIds = await graviInsurance.fetchInsuranceIds(user.address);
      
      // Verify the correct number of policies
      expect(policyIds.length).to.equal(2);
    });
    
    it("should retrieve a specific user policy", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy a policy
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Retrieve the specific policy
      const [
        _policyId,
        _policyHolder,
        _maxCoverageAmount,
        _premiumPaid,
        _startTime,
        _endTime,
        _isClaimed,
        _propertyAddress,
        _propertyValue
      ] = await graviInsurance.connect(user).getUserPolicy(policyId);
      
      // Verify the policy details
      expect(_policyId).to.equal(policyId);
      expect(_policyHolder).to.equal(user.address);
      expect(_propertyAddress).to.equal(propertyAddress);
      expect(_propertyValue).to.equal(propertyValue);
      expect(_premiumPaid).to.equal(premium);
    });
    
    it("should prevent non-policy holders from accessing policy details", async () => {
      const { graviInsurance, user, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy a policy as user
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Another user tries to access the policy details
      await expect(
        graviInsurance.connect(customer).getUserPolicy(policyId)
      ).to.be.revertedWith("Caller is not policy holder");
    });
    
    it("should retrieve claim moderators", async () => {
      const { graviInsurance, owner, user, minter, customer } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up a claim with moderators
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderators
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      await graviInsurance.connect(owner).addModeratorToPool(customer.address, ethers.parseEther("10"));
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Test incident");
      
      // Moderators assess
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      await graviInsurance.connect(customer).assessClaim(1, false, 0);
      
      // Retrieve claim moderators
      const moderators = await graviInsurance.getClaimModerators(1);
      
      // Verify moderators
      expect(moderators.length).to.equal(2);
      expect(moderators).to.include(minter.address);
      expect(moderators).to.include(customer.address);
    });
  });

  describe("Test 16: Edge Case Error Handling", () => {
    it("should revert when modifying non-existent event", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      await expect(
        graviInsurance.connect(owner).modifyDisasterEvent(
          "NonExistentEvent",
          "New Name",
          "New Description",
          1234567890
        )
      ).to.be.revertedWith("Event does not exist");
    });
    
    it("should revert when removing non-existent event", async () => {
      const { graviInsurance, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      await expect(
        graviInsurance.connect(owner).removeDisasterEvent("NonExistentEvent")
      ).to.be.revertedWith("Event does not exist");
    });
    
    it("should handle invalid premium rate in constructor", async () => {
      const { graviCha, graviOracle } = await loadFixture(deployGraviInsuranceFixture);
      
      const GraviInsuranceFactory = await ethers.getContractFactory("GraviInsurance");
      
      await expect(
        GraviInsuranceFactory.deploy(
          "FIRE",
          0, // Invalid premium rate
          await graviCha.getAddress(),
          await graviOracle.getAddress()
        )
      ).to.be.revertedWith("Invalid premium rate");
    });
    
    it("should revert when claiming with a non-existent policy ID", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Add a disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Generate a random policy ID that doesn't exist
      const fakePolicyId = ethers.keccak256(ethers.toUtf8Bytes("fake-policy-id"));
      
      // Try to start a claim with the fake policy ID
      await expect(
        graviInsurance.connect(user).startAClaim("EVT#1", fakePolicyId, "Test incident")
      ).to.be.revertedWith("Not the policy holder");
    });
    
    it("should revert when policy start time is after end time", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      
      // Current time
      const now_time = Math.floor(Date.now() / 1000);
      
      // Try to buy with invalid coverage days (0)
      const coverageDays = 0;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      await expect(
        graviInsurance.connect(user).buyInsurance(
          now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
        )
      ).to.be.revertedWith("Start time must be before end time");
    });
    
    it("should return empty array when user has no claims", async () => {
      const { graviInsurance, user } = await loadFixture(deployGraviInsuranceFixture);
      
      // Try to get user claims when there are none
      await expect(
        graviInsurance.connect(user).getUserClaims()
      ).to.be.revertedWith("User has no claims");
    });
  });

  describe("Test 17: Advanced Donation Features", () => {
    it("should track multiple donations from the same user", async () => {
      const { graviInsurance, graviCha, user, owner } = await loadFixture(deployGraviInsuranceFixture);
      
      // Set up graviCha minter
      await graviCha.connect(owner).addMinter(await graviInsurance.getAddress());
      
      // Make multiple donations
      await graviInsurance.connect(user).donate({ value: ethers.parseEther("1") });
      await graviInsurance.connect(user).donate({ value: ethers.parseEther("2") });
      
      // Get all donors
      const [donors, amounts] = await graviInsurance.getAllDonors();
      
      // Find the user in the donors array
      const userIndex = donors.findIndex(addr => addr === user.address);
      expect(userIndex).to.not.equal(-1);
      
      // Verify total donation amount (should be 3 ETH)
      expect(amounts[userIndex]).to.equal(ethers.parseEther("3"));
    });
    
    it("should return empty arrays when there are no donors", async () => {
      const { graviInsurance } = await loadFixture(deployGraviInsuranceFixture);
      
      // Get all donors when there are none
      const [donors, amounts] = await graviInsurance.getAllDonors();
      
      // Should return empty arrays
      expect(donors.length).to.equal(0);
      expect(amounts.length).to.equal(0);
    });
    
    it("should return top donors in correct order", async () => {
      const { graviInsurance, graviCha, owner, user, customer, minter } = await loadFixture(deployGraviInsuranceFixture);
      
      // Set up graviCha minter
      await graviCha.connect(owner).addMinter(await graviInsurance.getAddress());
      
      // Make donations with different amounts in non-descending order
      await graviInsurance.connect(user).donate({ value: ethers.parseEther("1") });
      await graviInsurance.connect(customer).donate({ value: ethers.parseEther("3") });
      await graviInsurance.connect(minter).donate({ value: ethers.parseEther("2") });
      
      // Get top donors
      const [topDonors, topAmounts] = await graviInsurance.getTopDonors();
      
      // Verify order (should be sorted by amount: customer, minter, user)
      expect(topDonors[0]).to.equal(customer.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("3"));
      
      expect(topDonors[1]).to.equal(minter.address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("2"));
      
      expect(topDonors[2]).to.equal(user.address);
      expect(topAmounts[2]).to.equal(ethers.parseEther("1"));
    });

    it("should return user's claims and their details", async () => {
      const { graviInsurance, owner, user, minter } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Buy insurance
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster",
        "Test description",
        now_time
      );
      
      // Add moderator
      await graviInsurance.connect(owner).addModeratorToPool(minter.address, ethers.parseEther("10"));
      
      // File claim
      const incident = "Test incident description";
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, incident);
      
      // Let moderator assess
      await graviInsurance.connect(minter).assessClaim(1, true, ethers.parseEther("5"));
      
      // Get user claims
      const [claimIds, policyIds, moderatorList, statuses, descriptions] = await graviInsurance.connect(user).getUserClaims();
      
      // Verify data
      expect(claimIds.length).to.equal(1);
      expect(claimIds[0]).to.equal(1);
      expect(policyIds[0]).to.equal(policyId);
      expect(moderatorList[0][0]).to.equal(minter.address);
      expect(statuses[0]).to.equal("Pending");
      expect(descriptions[0]).to.equal(incident);
    });
  });

  describe("Test 19: Additional Cancel Claim Tests", () => {
    it("should show correct claim status after cancellation", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Set up: Buy insurance and file a claim
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "123 Maple St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Disaster for Status Check",
        "Testing claim status after cancellation",
        now_time
      );
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Claim for status test");
      
      // Verify initial status is Pending
      const [, , , , , , initialStatus] = await graviInsurance.getClaimDetails(1);
      expect(initialStatus).to.equal("Pending");
      
      // Cancel the claim
      await graviInsurance.connect(user).cancelClaim(1);
      
      // Verify status changed to Denied after cancellation
      const [, , , , , , finalStatus] = await graviInsurance.getClaimDetails(1);
      expect(finalStatus).to.equal("Cancelled");
    });

    it("should emit ClaimProcessed event on cancellation with correct parameters", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Setup
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "456 Event Ave";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Event Emission",
        "Testing event emission on cancellation",
        now_time
      );
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Claim for event test");
      
      // Test the event emission with specific parameters
      await expect(graviInsurance.connect(user).cancelClaim(1))
        .to.emit(graviInsurance, "ClaimProcessed")
        .withArgs(1, 3, 0); // ClaimId=1, Status=Cancelled (3), Amount=0
    });
    
    it("should return true when claim is successfully cancelled", async () => {
      const { graviInsurance, owner, user } = await loadFixture(deployGraviInsuranceFixture);
      const now_time = Math.floor(Date.now() / 1000);
      
      // Setup
      const coverageDays = 30;
      const propertyValue = ethers.parseEther("20");
      const propertyAddress = "789 Return St";
      const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
      
      const tx = await graviInsurance.connect(user).buyInsurance(
        now_time, coverageDays, propertyAddress, propertyValue, { value: premium }
      );
      const receipt = await tx.wait();
      const policyId = await extractPolicyIdFromReceipt(graviInsurance, receipt);
      
      // Add disaster event
      await graviInsurance.connect(owner).addDisasterEvent(
        "Test Return Value",
        "Testing return value on cancellation",
        now_time
      );
      
      // File claim
      await graviInsurance.connect(user).startAClaim("EVT#1", policyId, "Claim for return value test");
      
      // Check return value is true
      const result = await user.call({
        to: await graviInsurance.getAddress(),
        data: graviInsurance.interface.encodeFunctionData("cancelClaim", [1])
      });
      const decodedResult = graviInsurance.interface.decodeFunctionResult("cancelClaim", result);
      expect(decodedResult[0]).to.equal(true);
    });
  });
});