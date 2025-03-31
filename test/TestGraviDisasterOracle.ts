import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviDisasterOracle } from "../typechain-types";

describe("GraviDisasterOracle", function () {
  let oracle: GraviDisasterOracle;

  beforeEach(async function () {
    const GraviDisasterOracle = await ethers.getContractFactory("GraviDisasterOracle");
    oracle = (await GraviDisasterOracle.deploy()) as GraviDisasterOracle;
    await oracle.waitForDeployment();
  });

  it("got 3 values, the oracle should approve this claim", async function () {
    expect(await oracle.validateClaim("Fire damage", "Wildfire", "Photo evidence")).to.equal(true);
  });

  it("no incidentDescription, oracle should not approve this claim", async function () {
    expect(await oracle.validateClaim("", "Earthquake", "Video proof")).to.equal(false);
  });

  it("no disasterType, oracle should not approve this claim", async function () {
    expect(await oracle.validateClaim("Flood damage", "", "Satellite image")).to.equal(false);
  });

  it("no evidence, oracle should not approve this claim", async function () {
    expect(await oracle.validateClaim("Storm damage", "Hurricane", "")).to.equal(false);
  });
});