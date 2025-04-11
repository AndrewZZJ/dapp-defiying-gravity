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
  //const graviOracleAddress = deploymentConfig["GraviDisasterOracle"];
  if (!graviChaAddress || !graviDAOAddress) {
    throw new Error("Core contracts not deployed. Run deploy-main.ts first.");
  }

  // Load graviDAO contract.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Define the three insurances.
  const insurances = [
    { name: "Fire Insurance", disaster: "fire", premium: 4 },
    { name: "Flood Insurance", disaster: "flood", premium: 5 },
    { name: "Earthquake Insurance", disaster: "earthquake", premium: 6 },
  ];

  // To hold deployed insurance data.
  // const deployedInsurances: Record<string, { nftAddress: string; insuranceAddress: string }> = {};
  const deployedInsurances: Record<string, { insuranceAddress: string }> = {};


  for (const insurance of insurances) {
    console.log(`Deploying ${insurance.name}...`);

    // Deploy GraviInsurance.
    const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
    const graviInsurance = await GraviInsurance.deploy(
      insurance.disaster,
      insurance.premium,
      graviChaAddress,
      // graviPoolNFTAddress,
      // graviOracleAddress
    );
    await graviInsurance.waitForDeployment();
    const graviInsuranceAddress = await graviInsurance.getAddress();
    console.log(`${insurance.name} - GraviInsurance deployed at: ${graviInsuranceAddress}`);

    // Add an generic Disaster event to the GraviInsurance contract.
    const genericEventName = `${insurance.disaster.charAt(0).toUpperCase() + insurance.disaster.slice(1)} Generic Event`;
    const genericEventDescription = `A generic ${insurance.disaster} event occurred.`;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tranx = await graviInsurance.addDisasterEvent(
      genericEventName,
      genericEventDescription,
      currentTimestamp,
    );
    await tranx.wait();
    console.log(`${insurance.name} - Generic event added.`);

    // // Add an new treasury address to the GraviPoolNFT contract.
    // await graviPoolNFT.addTreasuryAddress(graviInsuranceAddress);
    // console.log(`${insurance.name} - NFT treasury added.`);

    // Transfer ownership of GraviInsurance to GraviDAO.
    await graviInsurance.transferOwnership(graviDAOAddress);
    console.log(`${insurance.name} - Ownership transferred to GraviDAO.`);

    // Add the insurance to the DAO.
    await graviDAO.addInsurancePool(insurance.name, graviInsuranceAddress);
    console.log(`${insurance.name} - Insurance added to GraviDAO.`);

    // Save the deployed insurance address.
    deployedInsurances[insurance.name] = {
      insuranceAddress: graviInsuranceAddress,
    };
  }

  // // Add each insurance to the DAO after NFT ownership transfer.
  // for (const insuranceName in deployedInsurances) {
  //   const { insuranceAddress } = deployedInsurances[insuranceName];
  //   await graviDAO.addInsurancePool(insuranceName, insuranceAddress);
  //   console.log(`Added insurance: ${insuranceName} to DAO.`);
  // }
    
  // Write insurances metadata to scripts/metadata/insurances.json.
  writeMetadata("insurances.json", deployedInsurances);

  // // Optionally update the global deployment config with insurance and NFT addresses separately.
  // writeDeploymentConfig({
  //     ...deploymentConfig,
  //     ...Object.fromEntries(
  //       Object.entries(deployedInsurances).flatMap(([name, addrs]) => [
  //         [`${name.replace(/\s+/g, "")}`, addrs.insuranceAddress],
  //         [`${name.replace(/\s+/g, "")}NFT`, addrs.nftAddress],
  //       ])
  //     ),
  //   });

  // Optionally update the global deployment config with insurance addresses.
  writeDeploymentConfig({
    ...deploymentConfig,
    ...Object.fromEntries(
      Object.entries(deployedInsurances).map(([name, addrs]) => [
        name.replace(/\s+/g, ""), // e.g. "FireInsurance"
        addrs.insuranceAddress,
      ])
    )
  });
  // Update the global deployment config with both NFT and insurance addresses.


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});