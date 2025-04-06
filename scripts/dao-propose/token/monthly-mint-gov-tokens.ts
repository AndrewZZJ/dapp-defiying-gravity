// scripts/dao-propose/tokens/monthly-mint-gov-tokens.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeDeploymentConfig, writeMetadata } from "../../utils/deploymentUtils";
import {
  createProposal,
  voteOnProposal,
  queueProposal,
  simulateTimeSkip,
  executeProposal,
  printProposalInfo,
} from "../../utils/daoUtils";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Starting monthly mint of governance tokens via governance with account:", deployerAddress);

  // Load deployment configuration.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviGovernanceAddress = deploymentConfig["GraviGovernance"];
  if (!graviDAOAddress || !graviGovAddress || !graviGovernanceAddress) {
    throw new Error("Required addresses not found in deployment config.");
  }
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  const graviGov = await ethers.getContractAt("GraviGov", graviGovAddress);
  const graviGovernance = await ethers.getContractAt("GraviGovernance", graviGovernanceAddress);

  // Print the number of governance tokens held by the DAO.
  console.log("Current governance token pool balance:");
  graviGov.balanceOf(graviDAOAddress).then((balance) => {
    console.log("Governance token pool balance:", balance.toString());
  });

  // Encode the function call for monthly minting of governance tokens.
  const encodedCall = graviDAO.interface.encodeFunctionData("monthlyMintGovTokens", []);
  const proposalDescription = "Monthly mint governance tokens.";

  // Create the proposal with the single action.
  const proposalId = await createProposal(graviGovernance, [graviDAOAddress], [0], [encodedCall], proposalDescription);
  console.log("Proposal created with ID:", proposalId.toString());

  // Display proposal status after creation.
  console.log("Proposal status, after creation:");
  await printProposalInfo(graviGovernance, proposalId);

  // Simulate the timelock delay until voting starts.
  await simulateTimeSkip(7200 * 12);
  console.log("Proposal status, after waiting until voting time:");
  await printProposalInfo(graviGovernance, proposalId);

  // Vote in favor of the proposal.
  await voteOnProposal(graviGovernance, proposalId, 1);
  console.log("Voted in favor of the proposal.");

  // Simulate the end of the voting period.
  await simulateTimeSkip(50400 * 12);
  console.log("Proposal status, after end of voting period:");
  await printProposalInfo(graviGovernance, proposalId);

  // Queue the proposal.
  const descriptionHash = await queueProposal(graviGovernance, [graviDAOAddress], [0], [encodedCall], proposalDescription);
  console.log("Proposal queued with description hash:", descriptionHash);

  // Simulate a short delay until execution.
  await simulateTimeSkip(1 * 12);
  console.log("Proposal status, after queuing:");
  await printProposalInfo(graviGovernance, proposalId);

  // Execute the proposal.
  await executeProposal(graviGovernance, [graviDAOAddress], [0], [encodedCall], descriptionHash);
  console.log("Executed the proposal.");

  // Final proposal status.
  console.log("Final proposal status:");
  await printProposalInfo(graviGovernance, proposalId);

  console.log("Monthly governance tokens minting process via governance completed.");

  // Print the final number of governance tokens held by the DAO.
  graviGov.balanceOf(graviDAOAddress).then((balance) => {
    console.log("After minting Governance token pool balance:", balance.toString());
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});