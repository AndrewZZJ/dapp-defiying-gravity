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
  return { graviInsurance, owner, minter, user, customer };
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

      // 2. Get policyId from return value
      const receipt = await transaction.wait();
      const policyId = receipt?.logs[0]?.args?.policyId || (await transaction); // Fallback if event parsing fails

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
    // it("should allow user to file a claim", async () => {
    //   const { graviInsurance, user, owner} = await loadFixture(deployGraviInsuranceFixture);
    //   const now_time = Math.floor(Date.now() / 1000);
    //   const coverageDays = 30;
    //   const propertyValue = ethers.parseEther("20");
    //   const propertyAddress = "123 Maple St";
    //   const premium = await graviInsurance.calculatePremium(propertyAddress, propertyValue, coverageDays);
    //   const transaction = await graviInsurance.connect(user).buyInsurance(now_time, coverageDays, propertyAddress, propertyValue, { value: premium });
    //   const receipt = await transaction.wait();
    //   const policyId = receipt.logs.find(log => log.eventName === "PolicyPurchased").args.policyId;

    //   const eventId = "flood-2025"; // This will be the string key in the mapping
    //   await graviInsurance.connect(owner).addDisasterEvent(
    //     eventId,                         // eventName
    //     "Major flood affecting region",  // eventDescription
    //     now_time,                              // disasterDate (current time)
    //   );
    //   const [id] = await graviInsurance.fetchInsuranceIds(await user.getAddress());

    //   // await expect(
    //   //   graviInsurance.connect(user).fileClaim(id, "Flood damage")
    //   // ).to.emit(graviInsurance, "ClaimFiled");
    //   await expect(
    //     graviInsurance.connect(user).startAClaim(eventId, policyId, "Flood damage in basement")
    //   ).to.emit(graviInsurance, "ClaimStarted")
    //     .withArgs(anyValue, "Flood damage in basement"); // claimId is auto-incremented
    // });

//     it("should revert if non-owner files a claim", async () => {
//       await insurance.connect(user).buyInsurance("999 Birch Ln", ethers.utils.parseEther("25"), { value: premium });
//       const [id] = await insurance.fetchInsuranceIds(await user.getAddress());

//       await expect(
//         insurance.connect(mod1).fileClaim(id, "Landslide")
//       ).to.be.revertedWith("Only policy owner can file claim");
//     });
  });

    describe("Test 3: Moderator Actions", () => {

      // it("should allow a moderator to vote on a claim", async () => {
      //   await expect(
      //     insurance.connect(mod1).voteOnClaim(0, true)
      //   ).to.emit(insurance, "ClaimVoted");
      // });

      // it("should revert if same moderator votes twice", async () => {
      //   await insurance.connect(mod1).voteOnClaim(0, true);
      //   await expect(
      //     insurance.connect(mod1).voteOnClaim(0, false)
      //   ).to.be.revertedWith("Moderator has already voted");
      // });
    });

  describe("Test 4: Claim Approval & Payout", () => {
    // it("should approve claim if 2/3 moderators vote true", async () => {
    //   await insurance.connect(user).buyInsurance("101 Elm St", ethers.utils.parseEther("50"), { value: premium });
    //   const [id] = await insurance.fetchInsuranceIds(await user.getAddress());
    //   await insurance.connect(user).fileClaim(id, "Wildfire");

    //   await insurance.connect(mod1).voteOnClaim(0, true);
    //   await insurance.connect(mod2).voteOnClaim(0, true);

    //   const claim = await insurance.getClaimDetails(0);
    //   expect(claim.isApproved).to.equal(true);
    // });

    // it("should deny claim if <2 votes are positive", async () => {
    //   await insurance.connect(user).buyInsurance("777 Palm Ave", ethers.utils.parseEther("15"), { value: premium });
    //   const [id] = await insurance.fetchInsuranceIds(await user.getAddress());
    //   await insurance.connect(user).fileClaim(id, "Hurricane");

    //   await insurance.connect(mod1).voteOnClaim(0, false);
    //   await insurance.connect(mod2).voteOnClaim(0, true);
    //   await insurance.connect(mod3).voteOnClaim(0, false);

    //   const claim = await insurance.getClaimDetails(0);
    //   expect(claim.isApproved).to.equal(false);
    // });

    // it("should allow payout for approved claims", async () => {
    //   await insurance.connect(user).buyInsurance("1717 Storm Dr", ethers.utils.parseEther("100"), { value: premium });
    //   const [id] = await insurance.fetchInsuranceIds(await user.getAddress());
    //   await insurance.connect(user).fileClaim(id, "Blizzard");

    //   await insurance.connect(mod1).voteOnClaim(0, true);
    //   await insurance.connect(mod2).voteOnClaim(0, true);

    //   const balanceBefore = await ethers.provider.getBalance(await user.getAddress());
    //   const tx = await insurance.connect(user).executePayout(0);
    //   await tx.wait();
    //   const balanceAfter = await ethers.provider.getBalance(await user.getAddress());

    //   expect(balanceAfter).to.be.gt(balanceBefore);
    // });

    // it("should revert payout if claim not approved", async () => {
    //   await insurance.connect(user).buyInsurance("999 Rejected St", ethers.utils.parseEther("60"), { value: premium });
    //   const [id] = await insurance.fetchInsuranceIds(await user.getAddress());
    //   await insurance.connect(user).fileClaim(id, "No disaster");
    //   await insurance.connect(mod1).voteOnClaim(0, false);
    //   await insurance.connect(mod2).voteOnClaim(0, false);

    //   await expect(
    //     insurance.connect(user).executePayout(0)
    //   ).to.be.revertedWith("Claim not approved");
    // });
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

    // it("should return claim details", async () => {
    //   await insurance.connect(user).buyInsurance("424 Claim Rd", ethers.utils.parseEther("30"), { value: premium });
    //   const [id] = await insurance.fetchInsuranceIds(await user.getAddress());
    //   await insurance.connect(user).fileClaim(id, "Lightning");
    //   const claim = await insurance.getClaimDetails(0);
    //   expect(claim.description).to.equal("Lightning");
    // });
  });

});