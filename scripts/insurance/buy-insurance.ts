// scripts/insurance/buy-insurance.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";
import { Block } from "ethers";

async function main() {
  // Example property details.
  const propertyAddress = "382 Main St, Springfield, USA";
  const propertyValue = ethers.parseEther("1000000"); // 1 million USD
  const coveragePeriod = 365 * 24 * 60 * 60; // 1 year in seconds

  // Accept token amount as a command-line argument; default to 100.
  const tokenAmount = process.argv[2] ? parseInt(process.argv[2]) : 100;
  console.log(`Purchasing ${tokenAmount} governance tokens...`);

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const provider = ethers.provider;

  // Load deployment config to get necessary addresses.
  const deploymentConfig = loadDeploymentConfig();
  const fireInsuranceAddress = deploymentConfig["FireInsurance"];
  if (!fireInsuranceAddress ) {
    throw new Error("Required fireInsuranceAddress not found in deployment config.");
  }

  // Get contract instances.
  const fireInsurance = await ethers.getContractAt("IGraviInsurance", fireInsuranceAddress);
  
  // Record pre-purchase balances.
  const ethBalanceBefore = await provider.getBalance(deployerAddress);
  console.log("Before Purchase:");
  console.log("ETH Balance:", ethers.formatEther(ethBalanceBefore));

  // Calculate the cost for purchasing the desired number of tokens.
  const premium = await fireInsurance.calculatePremium(propertyAddress, propertyValue, coveragePeriod);
  console.log("Ether required (wei):", premium.toString());
  console.log("Ether required (ETH):", ethers.formatEther(premium));

  // Calculate the calculateCoverageAmountFromPremium
  const coverageAmount = await fireInsurance.calculateCoverageAmountFromPremium(premium);
  console.log("Coverage Amount (wei):", coverageAmount.toString());
  console.log("Coverage Amount (ETH):", ethers.formatEther(coverageAmount));

  // Buy insurance.
  console.log("Buying insurance...");
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
  if (!currentBlock) {
    throw new Error("Failed to fetch the current block.");
  }
  const startTimeUInt = currentBlock.timestamp + 1; // Start time is the next block

  const trans = await fireInsurance.buyInsurance(
    startTimeUInt,
    coveragePeriod,
    propertyAddress,
    propertyValue.toString(),
    { value: premium }
  );
  await trans.wait();

  // Print the number of fetchInsuranceIds
  const insuranceIds = await fireInsurance.fetchInsuranceIds(deployerAddress);
  console.log("Insurance IDs:", insuranceIds.toString());

  // Print final balances.
  const ethBalanceAfter = await provider.getBalance(deployerAddress);
  console.log("After Purchase:");

  // Determine the difference in ETH balance.
  const ethDifference = ethBalanceBefore - ethBalanceAfter;
  console.log("ETH Balance After:", ethers.formatEther(ethBalanceAfter));
  console.log("Difference in ETH Balance:", ethers.formatEther(ethDifference));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
