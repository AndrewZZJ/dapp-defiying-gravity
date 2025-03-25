// scripts/deploy/deploy-insurance-initial.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeDeploymentConfig, writeMetadata } from "../utils/deploymentUtils";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying initial insurances with account:", deployerAddress);

  // Load core deployments.
  const deploymentConfig = loadDeploymentConfig();
  const graviChaAddress = deploymentConfig["GraviCha"];
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviChaAddress || !graviDAOAddress) {
    throw new Error("Core contracts not deployed. Run deploy-main.ts first.");
  }

  // Load graviDAO contract.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Define the three insurances.
  const insurances = [
    { name: "Fire Insurance", disaster: "fire", premium: 5 },
    { name: "Flood Insurance", disaster: "flood", premium: 5 },
    { name: "Earthquake Insurance", disaster: "earthquake", premium: 5 },
  ];

  // To hold deployed insurance data.
  const deployedInsurances: Record<string, { nftAddress: string; insuranceAddress: string }> = {};

  for (const insurance of insurances) {
    console.log(`Deploying ${insurance.name}...`);

    // Deploy GraviPoolNFT.
    const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
    const graviPoolNFT = await GraviPoolNFT.deploy(graviChaAddress);
    await graviPoolNFT.waitForDeployment();
    const graviPoolNFTAddress = await graviPoolNFT.getAddress();
    console.log(`${insurance.name} - GraviPoolNFT deployed at: ${graviPoolNFTAddress}`);

    // Deploy GraviInsurance.
    const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
    const graviInsurance = await GraviInsurance.deploy(
      insurance.disaster,
      insurance.premium,
      graviChaAddress,
      graviPoolNFTAddress
    );
    await graviInsurance.waitForDeployment();
    const graviInsuranceAddress = await graviInsurance.getAddress();
    console.log(`${insurance.name} - GraviInsurance deployed at: ${graviInsuranceAddress}`);

    // Set the NFT treasury to the insurance contract.
    await graviPoolNFT.setTreasury(graviInsuranceAddress);
    console.log(`${insurance.name} - NFT treasury set.`);

    // Transfer ownership to GraviDAO.
    await graviInsurance.transferOwnership(graviDAOAddress);
    await graviPoolNFT.transferOwnership(graviDAOAddress);
    console.log(`${insurance.name} - Ownership transferred to GraviDAO.`);

    // Add the insurance to the DAO.
    await graviDAO.addInsuranceAndNFTPool(
      insurance.name,
      graviInsuranceAddress,
      graviPoolNFTAddress);

    console.log(`Added insurance: ${insurance.name} to DAO.`);

    // Save the deployed addresses.
    deployedInsurances[insurance.name] = {
      nftAddress: graviPoolNFTAddress,
      insuranceAddress: graviInsuranceAddress,
    };
  }

  // Write insurances metadata to scripts/metadata/insurances.json.
  writeMetadata("insurances.json", deployedInsurances);

  // Optionally update the global deployment config with insurance addresses.
  writeDeploymentConfig({
    ...deploymentConfig,
    ...Object.fromEntries(
      Object.entries(deployedInsurances).map(([name, addrs]) => [
        name.replace(/\s+/g, ""), // e.g. "FireInsurance"
        addrs.insuranceAddress,
      ])
    ),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});