// scripts/deploy/initial-nft-auctions.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

// Define the dictionary of initial NFTs for each insurance.
// Keys: Insurance names.
// Values: Array of token URIs to be minted (for example purposes, replace with actual URIs).
const initialNFTs: Record<string, string[]> = {
  "Fire Insurance": ["https://drive.google.com/uc?id=1f_xy2l8bD-NXwH7t7WE2qI4mw2O0PHPR&export=view"],
  "Flood Insurance": ["https://drive.google.com/uc?id=1cvsJU54aXFQBFgoJMUe8ociNTjeofOCP&export=view"],
  "Earthquake Insurance": ["https://drive.google.com/uc?id=1ZNQ_YYtjwMwsmtJJEY-SSqgPvTIXhux2&export=view"],
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Monthly mint NFTs for pools using account:", await deployer.getAddress());

  // Load deployment config to get the DAO address.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviDAOAddress) {
    throw new Error("GraviDAO address not found in deployment config.");
  }

  // Get the contract instance which contains monthlyMintNFTForPool.
  // Replace "GraviDAO" with the appropriate contract name if needed.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Loop through each insurance pool and mint its NFTs.
  for (const insuranceName in initialNFTs) {
    const tokenURIs = initialNFTs[insuranceName];
    console.log(`Minting NFTs for ${insuranceName}:`, tokenURIs);
    const tx = await graviDAO.monthlyMintNFTForPool(insuranceName, tokenURIs);
    await tx.wait();
    console.log(`Monthly NFTs minted for ${insuranceName}. Transaction hash: ${tx.hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});