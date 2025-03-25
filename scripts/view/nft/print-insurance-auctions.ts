// scripts/dao/print-insurance-auctions.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", await deployer.getAddress());

  // Load DAO deployment config.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviDAOAddress) {
    throw new Error("GraviDAO address not found in deployment config.");
  }

  // Get the DAO contract instance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Retrieve all insurance pool names.
  const poolNames: string[] = await graviDAO.getAllInsurancePoolNames();
  console.log("Insurance Pool Names:", poolNames);

  // Loop through each pool name.
  for (const poolName of poolNames) {
    // Retrieve the NFT contract address associated with this insurance.
    // (Assumes getInsurancePoolAddresses returns the NFT pool address.)
    const poolAddress = await graviDAO.getInsurancePoolAddresses(poolName);
    const nftPoolAddress = poolAddress[1];
    console.log(`Pool: ${poolName} -- NFT Contract Address: ${nftPoolAddress}`);

    // Get the NFT contract instance.
    const graviPoolNFT = await ethers.getContractAt("GraviPoolNFT", nftPoolAddress);

    // Retrieve auctioned NFT token IDs.
    const tokenIds = await graviPoolNFT.getAuctionedNFTs();
    console.log(`Auctioned NFTs for ${poolName}:`, tokenIds);

    // Loop through each token ID and print its auction details.
    for (const tokenId of tokenIds) {
      // Retrieve auction details for the given token.
      const auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
      console.log(`Auction details for token ${tokenId} in pool ${poolName}:`, auctionDetails);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});