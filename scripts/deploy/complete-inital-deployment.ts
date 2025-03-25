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
  if (!graviDAOAddress) {
    throw new Error("Core contracts not deployed. Run deploy-main.ts first.");
  }

  // Finally, finish the initial setup by revoking deployer’s elevated power.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  console.log("Finalizing initial setup by revoking deployer elevated power...");
  const tx = await graviDAO.setFinishedInitialSetup();
  await tx.wait();
  console.log("Initial setup finalized; deployer elevated power revoked.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});