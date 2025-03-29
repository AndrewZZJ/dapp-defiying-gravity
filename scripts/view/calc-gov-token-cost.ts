// scripts/view/calc-gov-token-cost.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  // Accept token amount as a command-line argument; default to 100.
  const tokenAmount = process.argv[2] ? parseInt(process.argv[2]) : 100;
  console.log(`Calculating purchase cost for ${tokenAmount} governance tokens`);

  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviDAOAddress) {
    throw new Error("GraviDAO address not found in deployment config.");
  }
  
  // Get the GraviDAO contract instance.
  const graviDAO = await ethers.getContractAt("IGraviDAO", graviDAOAddress);

  // Calculate purchase cost for the desired token amount.
  const [ethPrice, graviChaBurn] = await graviDAO.calculatesGovTokenPurchasePrice(tokenAmount);
  
  console.log(`To purchase ${tokenAmount} governance tokens:`);
  console.log(`- Wei cost: ${ethPrice.toString()}`);
  console.log(`- Ether cost: ${ethers.formatEther(ethPrice).toString()}`);
  console.log(`- GraviGov burn amount: ${graviChaBurn.toString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
