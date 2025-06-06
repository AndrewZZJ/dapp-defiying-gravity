// scripts/dao-propose/add-insurance-real.ts

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

  // Load core deployments.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  const graviGoveranceAddress = deploymentConfig["GraviGovernance"];
  const graviOracleAddress = deploymentConfig["GraviDisasterOracle"];
  // const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
  if (!graviDAOAddress || !graviChaAddress || !graviGoveranceAddress || !graviOracleAddress) {
    throw new Error("Required addresses not found in deployment config.");
  }
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  const graviGoverance = await ethers.getContractAt("GraviGovernance", graviGoveranceAddress);
  
  // Define the new insurance details.
  const newInsuranceName = "Hurricane Insurance";
  const disasterType = "hurricane";
  const premiumRate = 5;

  // Deploy a new GraviInsurance contract for the new insurance.
  const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
  const graviInsurance = await GraviInsurance.deploy(disasterType, premiumRate, graviChaAddress, graviOracleAddress);
  await graviInsurance.waitForDeployment();
  const insurancePoolAddress = await graviInsurance.getAddress();
  console.log(`${newInsuranceName} - GraviInsurance deployed at:`, insurancePoolAddress);

  // Optional: Set donation reward rate (if needed, similar to deploy-insurance-initial.ts)
  const donationRewardRate = 7500; // Example value, adjust as needed
  await graviInsurance.setDonationRewardRate(donationRewardRate);
  console.log(`${newInsuranceName} - Donation reward rate set to: ${donationRewardRate}`);

  // Transfer ownership of the insurance contract to the DAO.
  await graviInsurance.transferOwnership(graviDAOAddress);
  console.log(`${newInsuranceName} - Ownership transferred to DAO.`);

  // Encode the function call to add this insurance pair into the DAO registry.
  const encodedFunctionCall = graviDAO.interface.encodeFunctionData("addInsurancePool", [
    newInsuranceName,
    insurancePoolAddress
  ]);
  const proposalTitle = `Add ${newInsuranceName} to the DAO`;
  const proposalDescription = `Add ${newInsuranceName} and its NFT Pool to the DAO.`;

  // Create the proposal.
  const proposalId = await createFullProposal(
    graviGoverance,
    proposalTitle,
    proposalDescription,
    [graviDAOAddress], // Target is the DAO itself.
    [0],              // No ETH value.
    [encodedFunctionCall],
  );
  console.log("Proposal created with ID:", proposalId.toString());

  // Print proposal info (state, snapshot, deadline, current block).
  console.log("Proposal status, after creation:");
  await printProposalInfo(graviGoverance, proposalId);

  // Print all current proposals using getAllProposalIds.
  const allProposalIds = await graviGoverance.getAllProposalIds();
  console.log("All proposal IDs:", allProposalIds);

  // Print the full proposal details using getProposal.
  const proposalDetails = await graviGoverance.getProposalDetail(proposalId);
  console.log("Full proposal details:", proposalDetails);

  // Simulate the timelock delay. - To when you can vote.
  await simulateTimeSkip(7200 * 12);

  // // Print proposal info (state, snapshot, deadline, current block).
  // console.log("Proposal status, after waiting until voting time:");
  // await printProposalInfo(graviGoverance, proposalId);

  // // Vote in favor.
  // await voteOnProposal(graviGoverance, proposalId, 1);

  // // Simulate the end of the voting period.
  // await simulateTimeSkip(50400 * 12); // Advance until after the voting period ends.

  // // Print proposal info (state, snapshot, deadline, current block).
  // console.log("Proposal status, after end of voting period:");
  // await printProposalInfo(graviGoverance, proposalId);

  // // Queue the proposal.
  // const descriptionHash = await queueProposal(
  //   graviGoverance,
  //   [graviDAOAddress],
  //   [0],
  //   [encodedFunctionCall],
  //   proposalDescription
  // ); 

  // // Simulate the timelock delay. 12 second and 1 block.
  // await simulateTimeSkip(1 * 12);
  
  // // Print proposal info (state, snapshot, deadline, current block).
  // console.log("Proposal status, after queuing:");
  // await printProposalInfo(graviGoverance, proposalId);

  // // Execute the proposal.
  // await executeProposal(graviGoverance, [graviDAOAddress], [0], [encodedFunctionCall], descriptionHash);

  // // Print proposal info (state, snapshot, deadline, current block).
  // console.log("Proposal status, after execution:");
  // await printProposalInfo(graviGoverance, proposalId);

  // console.log("New insurance added via governance.");

  // // Save the new insurance addresses to the deployment config.
  // const insurancesPath = path.join(__dirname, "..", "metadata", "insurances.json");
  // // let deployedInsurances: Record<string, { nftAddress: string; insuranceAddress: string }> = {};
  // let deployedInsurances: Record<string, { insuranceAddress: string }> = {};
  // if (fs.existsSync(insurancesPath)) {
  //   const fileData = fs.readFileSync(insurancesPath, "utf8");
  //   deployedInsurances = JSON.parse(fileData);
  // }
  // // Append the new insurance.
  // deployedInsurances[newInsuranceName] = {
  //   // nftAddress: nftPoolAddress,
  //   insuranceAddress: insurancePoolAddress,
  // };
  // // Write the merged data back to insurances.json.
  // writeMetadata("insurances.json", deployedInsurances);
  // console.log("Updated insurances metadata saved to insurances.json.");

  // // Optionally update the global deployment config with insurance addresses.
  // writeDeploymentConfig({
  //   ...deploymentConfig,
  //   ...Object.fromEntries(
  //     Object.entries(deployedInsurances).map(([name, addrs]) => [
  //       name.replace(/\s+/g, ""), // e.g. "HurricaneInsurance"
  //       addrs.insuranceAddress,
  //     ])
  //   ),
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});