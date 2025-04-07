// scripts/deploy/distribute-tokens.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeMetadata } from "../utils/deploymentUtils";

// Define a distribution type.
type Distribution = {
  name: string;
  address: string;
  description: string;
  percentage: number; // Percentage of deployer's tokens to send
};

// Predefined distributions. Adjust values as needed.
const distributions: Distribution[] = [
  {
    name: "Advisor",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Replace with actual address
    description: "Allocation for advisors.",
    percentage: 10,
  },
  {
    name: "Early Investor",
    address: "0x65ef71Aa063cEcEB6569b9fdcd632952B2F141D9", // Replace with actual address
    description: "Allocation for early investors.",
    percentage: 15,
  },
  {
    name: "Community Fund",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Replace with actual address
    description: "Allocation for the community fund.",
    percentage: 5,
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Distributing tokens from deployer:", deployerAddress);

  // Load deployment config to get the GraviGov token address.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  if (!graviGovAddress) {
    throw new Error("GraviGov address not found in deployment config.");
  }

  // Debug send 5 ETH to the early investor address.
  const earlyInvestorAddress = distributions[1].address;
  const earlyInvestorAmount = ethers.parseEther("5");
  console.log(`Sending 5 ETH to early investor address: ${earlyInvestorAddress}`);
  const tx = await deployer.sendTransaction({
    to: earlyInvestorAddress,
    value: earlyInvestorAmount,
  });
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`5 ETH sent to ${earlyInvestorAddress}`);
  
  // Get the GraviGov contract instance.
  const graviGov = await ethers.getContractAt("GraviGov", graviGovAddress);

  // Fetch deployer's current token balance.
  const totalBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Deployer total token balance:", totalBalance.toString());

  // We will accumulate distribution details to later save to metadata.
  const distributionResults: any[] = [];

  // Process each distribution.
  for (const dist of distributions) {
    // Fetch the recipient's balance before the transfer.
    const beforeBalance = await graviGov.balanceOf(dist.address);
    console.log(
      `\nBefore transfer, ${dist.name} (${dist.address}) has a balance of: ${beforeBalance.toString()}`
    );

    // Calculate token amount: (percentage / 100) * totalBalance.
    const amount = (totalBalance * BigInt(dist.percentage)) / BigInt(100);
    console.log(
      `Transferring ${amount.toString()} tokens (${dist.percentage}%) to ${dist.name} at ${dist.address}`
    );

    // Transfer tokens from deployer to the recipient.
    const tx = await graviGov.transfer(dist.address, amount);
    await tx.wait();

    // Fetch the recipient's balance after the transfer.
    const afterBalance = await graviGov.balanceOf(dist.address);
    console.log(
      `After transfer, ${dist.name} (${dist.address}) has a balance of: ${afterBalance.toString()}`
    );

    distributionResults.push({
      name: dist.name,
      address: dist.address,
      description: dist.description,
      percentage: dist.percentage,
      amount: amount.toString(),
      beforeBalance: beforeBalance.toString(),
      afterBalance: afterBalance.toString(),
      txHash: tx.hash,
    });
  }

  // Query deployer's remaining token balance.
  const remainingBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Deployer remaining token balance:", remainingBalance.toString());

  // Calculate the remaining percentage of tokens.
  const remainingPercentage = (remainingBalance * 100n) / totalBalance;
  console.log("Remaining percentage of deployer's tokens:", remainingPercentage.toString(), "%");

  // Save the distribution results to metadata.
  writeMetadata("distributions.json", {
    distributedAt: new Date().toISOString(),
    initialBalance: totalBalance.toString(),
    remainingBalance: remainingBalance.toString(),
    remainingPercentage: remainingPercentage.toString(),
    distributions: distributionResults,
  });
  
  console.log("Token distribution complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});