// scripts/dao-propose/nft/monthly-mint-nfts.ts

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
  console.log("Starting monthly mint NFTs via governance with account:", deployerAddress);

  // Load deployment configuration.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviDAOAddress) {
    throw new Error("GraviDAO address not found in deployment config.");
  }
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Get all insurance pool names from the DAO.
  const insuranceNames: string[] = await graviDAO.getAllInsurancePoolNames();
  console.log("Insurance pool names:", insuranceNames);

  // Build proposal actions for each insurance pool.
  const targets: string[] = [];
  const values: number[] = [];
  const calldatas: string[] = [];
  for (const insuranceName of insuranceNames) {
    // For demonstration, mint one NFT per pool with a placeholder token URI.
    const tokenURIs = [`ipfs://exampleCID/${insuranceName}_monthlyMint.json`];
    const encodedCall = graviDAO.interface.encodeFunctionData("monthlyMintNFTForPool", [insuranceName, tokenURIs]);
    targets.push(graviDAOAddress);
    values.push(0);
    calldatas.push(encodedCall);
    console.log(`Prepared monthly mint for insurance pool: ${insuranceName} with token URI: ${tokenURIs[0]}`);
  }

  const proposalDescription = "Monthly mint NFTs for all insurance pools.";

  // Create the proposal.
  const proposalId = await createProposal(graviDAO, targets, values, calldatas, proposalDescription);
  console.log("Proposal created with ID:", proposalId.toString());

  // Display proposal status after creation.
  console.log("Proposal status, after creation:");
  await printProposalInfo(graviDAO, proposalId);

  // Simulate the timelock delay until voting starts.
  await simulateTimeSkip(7200 * 12);
  console.log("Proposal status, after waiting until voting time:");
  await printProposalInfo(graviDAO, proposalId);

  // Vote in favor of the proposal.
  await voteOnProposal(graviDAO, proposalId, 1);
  console.log("Voted in favor of the proposal.");

  // Simulate the timelock delay. 12 second and 1 block.
  await simulateTimeSkip(50400 * 12);
  console.log("Proposal status, after end of voting period:");
  await printProposalInfo(graviDAO, proposalId);

  // Queue the proposal.
  const descriptionHash = await queueProposal(graviDAO, targets, values, calldatas, proposalDescription);
  console.log("Proposal queued with description hash:", descriptionHash);

  // Simulate a short delay until execution.
  await simulateTimeSkip(1 * 12);
  console.log("Proposal status, after queuing:");
  await printProposalInfo(graviDAO, proposalId);

  // Execute the proposal.
  await executeProposal(graviDAO, targets, values, calldatas, descriptionHash);
  console.log("Executed the proposal.");

  // Final proposal status.
  console.log("Final proposal status:");
  await printProposalInfo(graviDAO, proposalId);

  console.log("Monthly NFT minting process via governance completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});