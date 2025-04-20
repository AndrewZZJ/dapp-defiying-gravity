import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviDisasterOracle } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviDisasterOracleFixture() {
  const [owner, customer] = await ethers.getSigners();
  const OracleFactory = await ethers.getContractFactory("GraviDisasterOracle");
  const oracle = (await OracleFactory.deploy()) as GraviDisasterOracle;
  await oracle.waitForDeployment();
  return { oracle, owner, customer };
}

describe("GraviDisasterOracle Contract", function () {
  describe("Disaster Type Validation", function () {
    it("should validate whitelisted disaster types", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      // Testing with valid disaster types
      await expect(oracle.validateClaim("FIRE"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("FIRE", true);
      
      await expect(oracle.validateClaim("FLOOD"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("FLOOD", true);
      
      await expect(oracle.validateClaim("EARTHQUAKE"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("EARTHQUAKE", true);
    });

    it("should reject non-whitelisted disaster types", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      // Testing with invalid disaster types
      await expect(oracle.validateClaim("HURRICANE"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("HURRICANE", false);
      
      await expect(oracle.validateClaim("TORNADO"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("TORNADO", false);
      
      await expect(oracle.validateClaim(""))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("", false);
    });

    it("should handle case sensitivity in disaster types", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      // Contract implementation uses keccak256("FIRE") for comparison
      // So "Fire" and "fire" would be different from "FIRE"
      await expect(oracle.validateClaim("fire"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("fire", false);
      
      await expect(oracle.validateClaim("Earthquake"))
        .to.emit(oracle, "DisasterTypeValidated")
        .withArgs("Earthquake", false);
    });

    it("should correctly return the validation result", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      // Use staticCall to get the return value without changing state
      const resultFire = await oracle.validateClaim.staticCall("FIRE");
      const resultInvalid = await oracle.validateClaim.staticCall("INVALID_TYPE");
      
      // Check the return values - should be booleans now
      expect(resultFire).to.be.true;
      expect(resultInvalid).to.be.false;
    });
  });

  describe("Address Validation", function() {
    it("should validate non-empty property addresses", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const validAddress = "123 Main Street, Anytown, USA";
      expect(await oracle.validateAddress(validAddress)).to.be.true;
    });

    it("should reject empty property addresses", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const emptyAddress = "";
      expect(await oracle.validateAddress(emptyAddress)).to.be.false;
    });
  });

  describe("Premium Calculation", function() {
    it("should calculate different premiums for different addresses", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const address1 = "123 Main Street, Anytown, USA";
      const address2 = "456 Oak Avenue, Othertown, USA";
      const propertyValue = ethers.parseEther("100");
      const coveragePeriod = 365; // 1 year
      
      const premium1 = await oracle.calculatePremium(address1, propertyValue, coveragePeriod);
      const premium2 = await oracle.calculatePremium(address2, propertyValue, coveragePeriod);
      
      expect(premium1).to.not.equal(premium2);
      expect(premium1).to.be.gt(0);
      expect(premium2).to.be.gt(0);
    });

    it("should calculate premium proportionally to property value", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const address = "123 Main Street, Anytown, USA";
      const lowValue = ethers.parseEther("50");
      const highValue = ethers.parseEther("100");
      const coveragePeriod = 365; // 1 year
      
      const lowPremium = await oracle.calculatePremium(address, lowValue, coveragePeriod);
      const highPremium = await oracle.calculatePremium(address, highValue, coveragePeriod);
      
      expect(highPremium).to.be.gt(lowPremium);
      // Should be roughly double since property value doubled (not exactly due to rounding)
      const ratio = Number(highPremium) / Number(lowPremium);
      expect(ratio).to.be.closeTo(2, 0.1);
    });

    it("should calculate premium proportionally to coverage period", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const address = "123 Main Street, Anytown, USA";
      const propertyValue = ethers.parseEther("100");
      const shortPeriod = 180; // 6 months
      const longPeriod = 365; // 1 year
      
      const shortPremium = await oracle.calculatePremium(address, propertyValue, shortPeriod);
      const longPremium = await oracle.calculatePremium(address, propertyValue, longPeriod);
      
      expect(longPremium).to.be.gt(shortPremium);
      // Should be roughly double since period doubled (not exactly due to rounding)
      const ratio = Number(longPremium) / Number(shortPremium);
      expect(ratio).to.be.closeTo(2, 0.1);
    });
  });

  describe("Coverage Calculation", function() {
    it("should calculate appropriate coverage based on property details", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const address = "123 Main Street, Anytown, USA";
      const propertyValue = ethers.parseEther("100");
      const coveragePeriod = 365; // 1 year
      
      const coverage = await oracle.calculateCoverage(address, propertyValue, coveragePeriod);
      
      // Coverage should never be zero and should be related to property value
      expect(coverage).to.be.gt(0);
      // Coverage should not exceed 80% of property value as per our implementation
      expect(coverage).to.be.lte(propertyValue * 80n / 100n);
      // Coverage should be at least 10% of property value as per our implementation
      expect(coverage).to.be.gte(propertyValue / 10n);
    });

    it("should calculate different coverage for different addresses", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const address1 = "123 Main Street, Anytown, USA";
      const address2 = "456 Oak Avenue, Othertown, USA";
      const propertyValue = ethers.parseEther("100");
      const coveragePeriod = 365; // 1 year
      
      const coverage1 = await oracle.calculateCoverage(address1, propertyValue, coveragePeriod);
      const coverage2 = await oracle.calculateCoverage(address2, propertyValue, coveragePeriod);
      
      expect(coverage1).to.not.equal(coverage2);
    });
  });

  describe("Damage Calculation", function() {
    it("should calculate damage based on policy, event, and property details", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const policyId = ethers.keccak256(ethers.toUtf8Bytes("testPolicy"));
      const eventId = "EVT#1";
      const propertyAddress = "123 Main Street, Anytown, USA";
      const coverageAmount = ethers.parseEther("50");
      
      const damageAmount = await oracle.calculateDamage(policyId, eventId, propertyAddress, coverageAmount);
      
      // Damage should be above zero
      expect(damageAmount).to.be.gt(0);
      // Damage should never exceed coverage amount
      expect(damageAmount).to.be.lte(coverageAmount);
      // Damage should be less than or equal to 90% of coverage amount (our implementation limit)
      expect(damageAmount).to.be.lte(coverageAmount * 90n / 100n);
    });

    it("should calculate consistent damage for same inputs", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const policyId = ethers.keccak256(ethers.toUtf8Bytes("testPolicy"));
      const eventId = "EVT#1";
      const propertyAddress = "123 Main Street, Anytown, USA";
      const coverageAmount = ethers.parseEther("50");
      
      const damageAmount1 = await oracle.calculateDamage(policyId, eventId, propertyAddress, coverageAmount);
      const damageAmount2 = await oracle.calculateDamage(policyId, eventId, propertyAddress, coverageAmount);
      
      // Same inputs should produce same output
      expect(damageAmount1).to.equal(damageAmount2);
    });

    it("should calculate different damage for different properties", async function() {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      
      const policyId = ethers.keccak256(ethers.toUtf8Bytes("testPolicy"));
      const eventId = "EVT#1";
      const propertyAddress1 = "123 Main Street, Anytown, USA";
      const propertyAddress2 = "456 Oak Avenue, Othertown, USA";
      const coverageAmount = ethers.parseEther("50");
      
      const damageAmount1 = await oracle.calculateDamage(policyId, eventId, propertyAddress1, coverageAmount);
      const damageAmount2 = await oracle.calculateDamage(policyId, eventId, propertyAddress2, coverageAmount);
      
      // Different inputs should yield different results
      expect(damageAmount1).to.not.equal(damageAmount2);
    });
  });
});