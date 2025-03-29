// scripts/dao-interact/purchase-gov-tokens.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  // Accept token amount as a command-line argument; default to 100.
  const tokenAmount = process.argv[2] ? parseInt(process.argv[2]) : 100;
  console.log(`Purchasing ${tokenAmount} governance tokens...`);

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const provider = ethers.provider;

  // Load deployment config to get necessary addresses.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  if (!graviDAOAddress || !graviGovAddress || !graviChaAddress) {
    throw new Error("Required addresses (GraviDAO, GraviGov, or GraviCha) not found in deployment config.");
  }

  // Get contract instances.
  const graviDAO = await ethers.getContractAt("IGraviDAO", graviDAOAddress);
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);
  const graviCha = await ethers.getContractAt("IGraviCha", graviChaAddress);

  // Record pre-purchase balances.
  const ethBalanceBefore = await provider.getBalance(deployerAddress);
  const govBalanceBefore = await graviGov.balanceOf(deployerAddress);
  const chaBalanceBefore = await graviCha.balanceOf(deployerAddress);
  console.log("Before Purchase:");
  console.log("ETH Balance:", ethers.formatEther(ethBalanceBefore));
  console.log("Governance Token Balance:", govBalanceBefore.toString());
  console.log("Charity Token Balance:", chaBalanceBefore.toString());

  // Calculate the cost for purchasing the desired number of tokens.
  const [ethPrice, graviChaBurn] = await graviDAO.calculatesGovTokenPurchasePrice(tokenAmount);
  console.log(`Cost for purchasing ${tokenAmount} tokens:`);
  console.log("Ether required:", ethPrice.toString());
  console.log("GraviGov burn required:", graviChaBurn.toString());

  // APPROVAL STEP:
  // Approve the GraviDAO contract to spend (burn) the required charity tokens.
  console.log("Approving charity token spending...");
  const approveTx = await graviCha.approve(graviDAOAddress, graviChaBurn);
  await approveTx.wait();
  console.log("Approval successful. Transaction hash:", approveTx.hash);

  // Purchase tokens. Ensure you pass the correct value in msg.value.
  console.log("Executing purchase...");
  const purchaseTx = await graviDAO.purchaseGovTokens(tokenAmount, { value: ethPrice });
  await purchaseTx.wait();
  console.log("Purchase successful. Transaction hash:", purchaseTx.hash);

  // Record post-purchase balances.
  const ethBalanceAfter = await provider.getBalance(deployerAddress);
  const govBalanceAfter = await graviGov.balanceOf(deployerAddress);
  const chaBalanceAfter = await graviCha.balanceOf(deployerAddress);

  console.log("\nAfter Purchase:");
  console.log("ETH Balance:", ethers.formatEther(ethBalanceAfter));
  console.log("Governance Token Balance:", govBalanceAfter.toString());
  console.log("Charity Token Balance:", chaBalanceAfter.toString());

  // Calculate and display the differences using native arithmetic.
  const ethDelta = ethBalanceBefore - ethBalanceAfter;
  const govDelta = govBalanceAfter - govBalanceBefore;
  const chaDelta = chaBalanceAfter - chaBalanceBefore;
  console.log("\bDelta (ETH spent):", ethers.formatEther(ethDelta));
  console.log("Delta (Governance tokens received):", govDelta.toString());
  console.log("Delta (Charity tokens change):", chaDelta.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
