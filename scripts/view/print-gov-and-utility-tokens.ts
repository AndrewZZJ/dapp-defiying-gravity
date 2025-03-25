// scripts/view/print-gov-and-utility-tokens.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer address:", deployerAddress);

  // Load deployment config.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  if (!graviGovAddress || !graviChaAddress) {
    throw new Error("Required addresses (GraviGov or GraviCha) not found in deployment config.");
  }

  // Get the GraviGov contract instance (assumed to implement IGraviGov).
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);

  // Print the governance token balance.
  const govBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Governance token balance of deployer:", govBalance.toString());

  // Get the GraviCha contract instance.
  const graviCha = await ethers.getContractAt("IGraviCha", graviChaAddress);

  // Get the GraviCha contract instance.
  const chaBalance = await graviCha.balanceOf(deployerAddress);
  console.log("Utility token balance of deployer:", chaBalance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});