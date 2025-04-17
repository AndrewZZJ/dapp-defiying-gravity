import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import { GraviDisasterOracle } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function deployGraviDisasterOracleFixture() {
  const [owner, customer] = await hre.ethers.getSigners();
  const OracleFactory = await ethers.getContractFactory("GraviDisasterOracle");
  const oracle = (await OracleFactory.deploy()) as GraviDisasterOracle;
  await oracle.waitForDeployment();
  return { oracle, owner, customer };
}

describe("GraviDisasterOracle Contract", function () {
  describe("Test 1: approve a claim", function () {
    it("should emit ClaimValidated(true) when all fields are filled", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      const result = await oracle.validateClaim("Fire damage", "Wildfire", "Photo evidence");
      expect(result).to.emit(oracle, "ClaimValidated").withArgs("Fire damage", "Wildfire", "Photo evidence", true);
    });
  });
  describe("Test 2: reject a claim", function () {
    it("no incidentDescription, oracle should not approve this claim", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      const result = await oracle.validateClaim("", "Earthquake", "Video proof");
      expect(result).to.emit(oracle, "ClaimValidated").withArgs("", "Wildfire", "Photo evidence", false);
    });
  
    it("no disasterType, oracle should not approve this claim", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      const result = await oracle.validateClaim("Flood damage", "", "Satellite image");
      expect(result).to.emit(oracle, "ClaimValidated").withArgs("Flood damage", "", "Satellite image", false);
    });
  
    it("no evidence, oracle should not approve this claim", async function () {
      const { oracle } = await loadFixture(deployGraviDisasterOracleFixture);
      const result = await oracle.validateClaim("Storm damage", "Hurricane", "");
      expect(result).to.emit(oracle, "ClaimValidated").withArgs("Storm damage", "Hurricane", "", false);
    });
  });
})