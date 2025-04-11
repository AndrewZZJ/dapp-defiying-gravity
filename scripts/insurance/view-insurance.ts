// scripts/insurance/view-insurance.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";
import { Block } from "ethers";

async function main() {
  // Example property details.
  const propertyAddress = "382 Main St, Springfield, USA";
  const propertyValue = ethers.parseEther("1000"); // 1,564,885.55 USD
  const coveragePeriod = 365; // 1 year in days

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
  const fireInsurance = await ethers.getContractAt("GraviInsurance", fireInsuranceAddress);

  // Print the number of fetchInsuranceIds
  const insuranceIds = await fireInsurance.fetchInsuranceIds(deployerAddress);
  console.log("Insurance IDs:", insuranceIds.toString());

  // Retrieve details for each policy using getUserPolicy
  console.log("\n\nUser Policies Details:");
  for (let i = 0; i < insuranceIds.length; i++) {
    const policyDetail = await fireInsurance.getUserPolicy(insuranceIds[i]);
    console.log(`\nPolicy ${i + 1}:`);
    console.log(`  Policy ID: ${policyDetail._policyId.toString()}`);
    console.log(`  Policy Holder: ${policyDetail._policyHolder}`);
    console.log(`  Max Coverage Amount: ${ethers.formatEther(policyDetail._maxCoverageAmount)} ETH`);
    console.log(`  Premium: ${ethers.formatEther(policyDetail._premiumPaid)} ETH`);
    console.log(`  Start Time: ${new Date(Number(policyDetail._startTime * BigInt(1000))).toISOString()}`);
    console.log(`  End Time: ${new Date(Number(policyDetail._endTime * BigInt(1000))).toISOString()}`);
    console.log(`  Is Claimed: ${policyDetail._isClaimed}`);
    console.log(`  Property Address: ${policyDetail._propertyAddress}`);
    console.log(`  Property Value: ${ethers.formatEther(policyDetail._propertyValue)} ETH`);
  }
  
  // // Get user policies using getUserPolicies
  // const policies = await fireInsurance.getUserPolicies();

  // console.log("\n\nPolicies:");
  // const policyIds = policies[0];
  // const policyHolders = policies[1];
  // const maxCoverageAmounts = policies[2];
  // const premiums = policies[3];
  // const startTimes = policies[4];
  // const endTimes = policies[5];
  // const isClaimedList = policies[6];
  // const propertyAddresses = policies[7];
  // const propertyValues = policies[8];

  // for (let i = 0; i < policyIds.length; i++) {
  //   console.log(`\nPolicy ${i + 1}:`);
  //   console.log(`  Policy ID: ${policyIds[i].toString()}`);
  //   console.log(`  Policy Holder: ${policyHolders[i]}`);
  //   console.log(`  Max Coverage Amount: ${ethers.formatEther(maxCoverageAmounts[i])} ETH`);
  //   console.log(`  Premium: ${ethers.formatEther(premiums[i])} ETH`);
  //   console.log(`  Start Time: ${new Date(Number(startTimes[i] * BigInt(1000))).toISOString()}`);
  //   console.log(`  End Time: ${new Date(Number(endTimes[i] * BigInt(1000))).toISOString()}`);
  //   console.log(`  Is Claimed: ${isClaimedList[i]}`);
  //   console.log(`  Property Address: ${propertyAddresses[i]}`);
  //   console.log(`  Property Value: ${ethers.formatEther(propertyValues[i])} ETH`);
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
