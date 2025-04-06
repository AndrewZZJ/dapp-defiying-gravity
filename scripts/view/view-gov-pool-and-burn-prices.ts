// scripts/view/view-gov-pool-and-burn-prices.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviGovAddress = deploymentConfig["GraviGov"];
  if (!graviDAOAddress || !graviGovAddress) {
    throw new Error("GraviDAO or GraviGov address not found in deployment config.");
  }
  
  // Get the GraviDAO contract instance that.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  const graviGov = await ethers.getContractAt("GraviGov", graviGovAddress);

  // 1. Get the governance token pool balance.
  const poolBalance = await graviGov.balanceOf(graviDAOAddress);
  // const poolBalance = await graviDAO.getGovTokenPoolBalance();
  console.log("Governance Token Pool Balance:", poolBalance.toString());

  // 2. Get the current purchase price and burn amount for 1 token.
  const [ethPrice, graviChaBurn] = await graviDAO.calculatesGovTokenPurchasePrice(1);
  console.log(`Current Wei price per token: ${ethPrice.toString()}`);
  console.log(`Current Ether price per token: ${ethers.formatEther(ethPrice).toString()}`);
  console.log("Current GraviGov burn per token:", graviChaBurn.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
