// scripts/dao-interact/convert-to-charity.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  // Accept conversion amount as a command-line argument; default to 100.
  const conversionAmount = process.argv[2] ? parseInt(process.argv[2]) : 100;
  console.log(`Converting ${conversionAmount} governance tokens to charity tokens...`);

  // Load deployment config to get necessary addresses.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  if (!graviGovAddress || !graviChaAddress) {
    throw new Error("Required addresses (GraviGov or GraviCha) not found in deployment config.");
  }

  // Get contract instances.
  // GraviGov is our governance token contract (implements IGraviGov).
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);
  // GraviCha is the charity token contract; we use the standard ERC20 interface.
  const graviCha = await ethers.getContractAt("IERC20", graviChaAddress);

  // Retrieve and display the current charity token exchange rate.
  const exchangeRate = await graviGov.charityTokenExchangeRate();
  console.log("Current Charity Token Exchange Rate:", exchangeRate.toString());

  // Get deployer details.
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  // Record pre-conversion balances.
  const govBalanceBefore = await graviGov.balanceOf(deployerAddress);
  const chaBalanceBefore = await graviCha.balanceOf(deployerAddress);
  // Get DAO address (the pool address) from the GraviGov contract.
  const daoAddress = await graviGov.dao();
  const daoGovBalanceBefore = await graviGov.balanceOf(daoAddress);

  console.log("\n--- Before Conversion ---");
  console.log("Deployer GraviGov Balance:", govBalanceBefore.toString());
  console.log("Deployer GraviCha Balance:", chaBalanceBefore.toString());
  console.log("DAO Pool GraviGov Balance:", daoGovBalanceBefore.toString());

  //   // Assume tokens have 18 decimals. Adjust if necessary.
  //   const decimals = await graviGov.decimals();
  //   const amountInWei = ethers.parseUnits(conversionAmount.toString(), decimals);

  // Execute conversion (this should move GraviGov tokens from the deployer to the DAO pool and award charity tokens).
  //   const tx = await graviGov.convertToCharityTokens(amountInWei);
  const tx = await graviGov.convertToCharityTokens(conversionAmount);
  await tx.wait();
  console.log("\nConversion successful. Transaction hash:", tx.hash);

  // Record post-conversion balances.
  const govBalanceAfter = await graviGov.balanceOf(deployerAddress);
  const chaBalanceAfter = await graviCha.balanceOf(deployerAddress);
  const daoGovBalanceAfter = await graviGov.balanceOf(daoAddress);

  console.log("\n--- After Conversion ---");
  console.log("Deployer GraviGov Balance:", govBalanceAfter.toString());
  console.log("Deployer GraviCha Balance:", chaBalanceAfter.toString());
  console.log("DAO Pool GraviGov Balance:", daoGovBalanceAfter.toString());

  // Calculate and display the deltas using native arithmetic.
  const govDelta = govBalanceBefore - govBalanceAfter;
  const chaDelta = chaBalanceAfter - chaBalanceBefore;
  const daoGovDelta = daoGovBalanceAfter - daoGovBalanceBefore;

  console.log("\n--- Deltas ---");
  console.log("Delta (Deployer GraviGov):", govDelta.toString());
  console.log("Delta (Deployer GraviCha):", chaDelta.toString());
  console.log("Delta (DAO Pool GraviGov):", daoGovDelta.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
