// scripts/view/print-voting-power.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer address:", deployerAddress);

  // Load deployment config.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviGovAddress || !graviDAOAddress) {
    throw new Error("Required addresses (GraviGov or GraviDAO) not found in deployment config.");
  }

  // Get the GraviGov contract instance (assumed to implement IGraviGov).
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);
  // Get the GraviDAO contract instance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Print the governance token balance.
  const balance = await graviGov.balanceOf(deployerAddress);
  console.log("Governance token balance of deployer:", balance.toString());

  // Get the current block and then check the voting power (snapshot at previous block).
  const currentBlock = await ethers.provider.getBlockNumber();
  const votingPower = await graviDAO.getVotes(deployerAddress, currentBlock - 1);
  console.log("Voting power of deployer:", votingPower.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});