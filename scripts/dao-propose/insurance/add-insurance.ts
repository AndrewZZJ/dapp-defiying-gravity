// scripts/dao-propose/insurance/add-insurance.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeDeploymentConfig, writeMetadata } from "../../utils/deploymentUtils";
import {
  createProposal,
  voteOnProposal,
  queueProposal,
  simulateTimeSkip,
  executeProposal,
  printProposalInfo, // Newly imported function
} from "../../utils/daoUtils";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Adding new insurance via governance with account:", deployerAddress);

  // Load core deployments.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  if (!graviDAOAddress || !graviChaAddress) {
    throw new Error("Required addresses not found in deployment config.");
  }
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Define the new insurance details.
  const newInsuranceName = "Hurricane Insurance";
  const disasterType = "hurricane";
  const premiumRate = 5;

  // Deploy a new GraviPoolNFT contract for the new insurance.
  const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
  const graviPoolNFT = await GraviPoolNFT.deploy(graviChaAddress);
  await graviPoolNFT.waitForDeployment();
  const nftPoolAddress = await graviPoolNFT.getAddress();
  console.log(`${newInsuranceName} - GraviPoolNFT deployed at:`, nftPoolAddress);

  // Deploy a new GraviInsurance contract for the new insurance.
  const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
  const graviInsurance = await GraviInsurance.deploy(disasterType, premiumRate, graviChaAddress, nftPoolAddress);
  await graviInsurance.waitForDeployment();
  const insurancePoolAddress = await graviInsurance.getAddress();
  console.log(`${newInsuranceName} - GraviInsurance deployed at:`, insurancePoolAddress);

  // Set the NFT treasury to the new insurance contract address.
  await graviPoolNFT.setTreasury(insurancePoolAddress);
  console.log(`${newInsuranceName} - NFT treasury set to insurance contract address.`);

  // Transfer ownership of the insurance contract to the DAO.
  await graviInsurance.transferOwnership(graviDAOAddress);
  console.log(`${newInsuranceName} - Ownership transferred to DAO.`);

  // Transfer ownership of the NFT contract to the DAO.
  await graviPoolNFT.transferOwnership(graviDAOAddress);
  console.log(`${newInsuranceName} - NFT ownership transferred to DAO.`);

  // Encode the function call to add this insurance pair into the DAO registry.
  const encodedFunctionCall = graviDAO.interface.encodeFunctionData("addInsuranceAndNFTPool", [
    newInsuranceName,
    insurancePoolAddress,
    nftPoolAddress,
  ]);
  const proposalDescription = `Add ${newInsuranceName} and its NFT Pool to the DAO.`;

  // Create the proposal.
  const proposalId = await createProposal(
    graviDAO,
    [graviDAOAddress], // Target is the DAO itself.
    [0],              // No ETH value.
    [encodedFunctionCall],
    proposalDescription
  );
  console.log("Proposal created with ID:", proposalId.toString());

  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after creation:");
  await printProposalInfo(graviDAO, proposalId);

  // Simulate the timelock delay. - To when you can vote.
  await simulateTimeSkip(7200 * 12);

  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after waiting until voting time:");
  await printProposalInfo(graviDAO, proposalId);

  // Vote in favor.
  await voteOnProposal(graviDAO, proposalId, 1);

  // Simulate the end of the voting period.
  await simulateTimeSkip(50400 * 12); // Advance until after the voting period ends.

  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after end of voting period:");
  await printProposalInfo(graviDAO, proposalId);

  // Queue the proposal.
  const descriptionHash = await queueProposal(
    graviDAO,
    [graviDAOAddress],
    [0],
    [encodedFunctionCall],
    proposalDescription
  ); 

  // Simulate the timelock delay. 12 second and 1 block.
  await simulateTimeSkip(1 * 12);
  
  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after queuing:");
  await printProposalInfo(graviDAO, proposalId);

  // Execute the proposal.
  await executeProposal(graviDAO, [graviDAOAddress], [0], [encodedFunctionCall], descriptionHash);

  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after execution:");
  await printProposalInfo(graviDAO, proposalId);

  console.log("New insurance added via governance.");

  // Save the new insurance addresses to the deployment config.
  const insurancesPath = path.join(__dirname, "..", "metadata", "insurances.json");
  let deployedInsurances: Record<string, { nftAddress: string; insuranceAddress: string }> = {};
  if (fs.existsSync(insurancesPath)) {
    const fileData = fs.readFileSync(insurancesPath, "utf8");
    deployedInsurances = JSON.parse(fileData);
  }
  // Append the new insurance.
  deployedInsurances[newInsuranceName] = {
    nftAddress: nftPoolAddress,
    insuranceAddress: insurancePoolAddress,
  };
  // Write the merged data back to insurances.json.
  writeMetadata("insurances.json", deployedInsurances);
  console.log("Updated insurances metadata saved to insurances.json.");

  // Optionally update the global deployment config with insurance addresses.
  writeDeploymentConfig({
    ...deploymentConfig,
    ...Object.fromEntries(
      Object.entries(deployedInsurances).map(([name, addrs]) => [
        name.replace(/\s+/g, ""), // e.g. "HurricaneInsurance"
        addrs.insuranceAddress,
      ])
    ),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});