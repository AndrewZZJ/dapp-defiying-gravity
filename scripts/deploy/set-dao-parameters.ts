// scripts/deploy/set-dao-parameters.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

// Define the desired configuration parameters.
const parameters = {
  governanceTokenParameters: {
    newPrice: ethers.parseUnits("0.01", "ether"),  // Price in ether to buy a governance token.
    newBurnAmount: ethers.parseUnits("10", "ether"), // Amount of utility tokens to burn when a governance token is brought.
    mintAmount: ethers.parseUnits("10000", "ether"), // Amount of tokens to mint additionally, monthly
  },
  // govParameters: {
  //   votingDelay: 7200,       // Delay (in blocks or seconds) before voting starts
  //   votingPeriod: 50400,    // Duration of the voting period
  //   proposalThreshold: 1000, // Threshold of tokens required to submit a proposal
  // }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress(); 
  console.log("Setting parameters using deployer:", deployerAddress);

  // Load deployed addresses from metadata.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviDAOAddress = deploymentConfig["GraviDAO"];

  if (!graviGovAddress || !graviDAOAddress) {
    throw new Error("Required contract addresses (GraviGov or GraviDAO) not found in deployment config.");
  }

  // Get contract instances.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Set Governance Token Parameters.
  console.log("Setting governance token parameters...");
  const { newPrice, newBurnAmount, mintAmount } = parameters.governanceTokenParameters;
  const txGov = await graviDAO.setGovernanceTokenParameters(newPrice, newBurnAmount, mintAmount);
  await txGov.wait();
  console.log("Governance token parameters set. Transaction hash:", txGov.hash);

  // // Set DAO Governance Parameters.
  // console.log("Setting DAO governance parameters...");
  // const { votingDelay, votingPeriod, proposalThreshold } = parameters.govParameters;
  // const txDAO = await graviDAO.setGovParameters(votingDelay, votingPeriod, proposalThreshold);
  // await txDAO.wait();
  // console.log("DAO governance parameters set. Transaction hash:", txDAO.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});