// scripts/dao-propose/time-skip.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeDeploymentConfig, writeMetadata } from "../utils/deploymentUtils";
import {
  createProposal,
  voteOnProposal,
  queueProposal,
  simulateTimeSkip,
  executeProposal,
  printProposalInfo, // Newly imported function
  createFullProposal,
} from "../utils/daoUtils";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Adding new insurance via governance with account:", deployerAddress);

  // Simulate the end of the voting period.
  await simulateTimeSkip(50400 * 12); // Advance until after the voting period ends.
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});