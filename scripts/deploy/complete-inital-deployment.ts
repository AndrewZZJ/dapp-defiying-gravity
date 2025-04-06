// scripts/deploy/complete-inital-deployment.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying initial insurances with account:", deployerAddress);

  // Load core deployments.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviGovernanceAddress = deploymentConfig["GraviGovernance"];
  if (!graviDAOAddress || !graviGovernanceAddress) {
    throw new Error("Core contracts not deployed. Run deploy-main.ts first.");
  }

  // Finally, grant ownership of GraviDAO to GraviGovernance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  // const graviGovernance = await ethers.getContractAt("GraviGovernance", graviGovernanceAddress);

  console.log("Transferring ownership of GraviDAO to GraviGovernance...");
  const tx = await graviDAO.transferOwnership(graviGovernanceAddress);
  await tx.wait();
  console.log("Ownership of GraviDAO transferred to GraviGovernance.");

  console.log("Initial setup finalized; deployer elevated power revoked.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});