// scripts/view/insurance/print-insurances-and-nft-pools.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer address:", deployerAddress);

  // Load deployment config.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviDAOAddress) {
    throw new Error("Required addresses (GraviDAO) not found in deployment config.");
  }

  // Get the GraviDAO contract instance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Get the current block and then check the voting power (snapshot at previous block).
  // Print the getAllInsurancePoolNames
  const insurancePoolNames = await graviDAO.getAllInsurancePoolNames();
  console.log("Insurance Pool Names:", insurancePoolNames);

  // Print the Insurance and NFT pool addresses from the DAO. Using getInsurancePoolAddresses per name.
  for (const poolName of insurancePoolNames) {
    const poolAddress = await graviDAO.getInsurancePoolAddresses(poolName);
    console.log(`Pool ${poolName} address:`, poolAddress);

    // Get the contract instance for the pool.
    const poolContract = await ethers.getContractAt("GraviInsurance", poolAddress[0]);

    // Get all the disaster events IDs for the pool.
    const disasterEvents = await poolContract.getAllDisasterEvents();
    console.log(`Disaster Events for pool ${poolName}:`, disasterEvents);
    for (const eventId of disasterEvents) {
      const disasterEvent = await poolContract.getDisasterEvent(eventId);
      console.log(`Disaster Event ${eventId}:`, disasterEvent);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});