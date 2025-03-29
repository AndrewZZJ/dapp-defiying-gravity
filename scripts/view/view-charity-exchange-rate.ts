// scripts/view/view-charity-exchange-rate.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  // Load deployment config to get the GraviGov address.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  if (!graviGovAddress) {
    throw new Error("GraviGov address not found in deployment config.");
  }

  // Get the GraviGov contract instance.
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);

  // Retrieve and print the charity token exchange rate.
  const exchangeRate = await graviGov.charityTokenExchangeRate();
  console.log("Current Charity Token Exchange Rate:", exchangeRate.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
