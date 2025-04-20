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
});