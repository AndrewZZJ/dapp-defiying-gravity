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
  const graviInsurance = (await GraviInsuranceFactory.deploy("FireInsurance", 100, graviCha)) as GraviInsurance;
  await graviInsurance.waitForDeployment();
  return { graviInsurance, graviCha, owner, minter, user, customer };
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
      
      // Process claim
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
      
      // Process claim
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
});