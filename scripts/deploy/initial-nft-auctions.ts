// scripts/deploy/initial-nft-auctions.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

// Define the dictionary of initial NFTs for each insurance.
// Keys: Insurance names.
// Values: Array of token URIs to be minted (for example purposes, replace with actual URIs).
const initialNFTs: Record<string, string[]> = {
  "Fire Insurance": ["https://yellow-generous-goldfish-728.mypinata.cloud/ipfs/bafkreifsxfxpfvs4ax42hrzb6npjmklrdee6l6v4livsyoiybcluiakf4m"],
  "Flood Insurance": ["https://yellow-generous-goldfish-728.mypinata.cloud/ipfs/bafkreiccic6cvackjndvvstz62zbeuqxyz2klq24ngkblam5yezwfhgk6m"],
  "Earthquake Insurance": ["https://yellow-generous-goldfish-728.mypinata.cloud/ipfs/bafkreib46vtbcievsjjmyi7lbgwzrghksxx2dr6kzfskz5k4yougjlxctm"],
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