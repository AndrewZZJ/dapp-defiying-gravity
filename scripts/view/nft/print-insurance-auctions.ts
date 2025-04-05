// scripts/dao/print-insurance-auctions.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", await deployer.getAddress());

  // Load DAO deployment config.
  const deploymentConfig = loadDeploymentConfig();
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
  if (!graviDAOAddress || !graviPoolNFTAddress) {
    throw new Error("GraviDAO or GraviPoolNFT address not found in deployment config.");
  }

  // Get the DAO contract instance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Get the NFT contract instance.
  const graviPoolNFT = await ethers.getContractAt("GraviPoolNFT", graviPoolNFTAddress);

  // Retrieve auctioned NFT token IDs.
  const tokenIds = await graviPoolNFT.getAuctionedNFTs();
  console.log(`Auctioned NFTs for:`, tokenIds);

  // Retrieve all insurance pool names.
  const poolNames: string[] = await graviDAO.getAllInsurancePoolNames();

  // Loop through each token ID and print its auction details.
  for (const tokenId of tokenIds) {
    // Retrieve auction details for the given token.
    const auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
    console.log(`Auction details for token ${tokenId}:`, auctionDetails);

    // Get the specific insurance pool address for this token ID.
    const insurancePoolAddress = await graviPoolNFT.getTreasuryAddress(tokenId);
    console.log(`Insurance Pool Address for token ${tokenId}:`, insurancePoolAddress);

    // Find the insurance pool name associated with this address.
    let matchingPoolName = "Unknown";
    for (const poolName of poolNames) {
      // The function returns a tuple: [insurancePoolAddress, nftPoolAddress].
      const poolAddresses = await graviDAO.getInsurancePoolAddresses(poolName);
      const currentInsurancePoolAddress = poolAddresses[0];
      
      // Compare the addresses (using toLowerCase for case-insensitive comparison).
      if (currentInsurancePoolAddress.toLowerCase() === insurancePoolAddress.toLowerCase()) {
        matchingPoolName = poolName;
        break;
      }
    }
    console.log(`Insurance Pool Name for token ${tokenId}:`, matchingPoolName);
  }
}

  // // Retrieve all insurance pool names.
  // const poolNames: string[] = await graviDAO.getAllInsurancePoolNames();
  // console.log("Insurance Pool Names:", poolNames);

  // // Loop through each pool name.
  // for (const poolName of poolNames) {
  //   // Retrieve the NFT contract address associated with this insurance.
  //   // (Assumes getInsurancePoolAddresses returns the NFT pool address.)
  //   const poolAddress = await graviDAO.getInsurancePoolAddresses(poolName);
  //   const nftPoolAddress = poolAddress[1];
  //   console.log(`Pool: ${poolName} -- NFT Contract Address: ${nftPoolAddress}`);

  //   // Get the NFT contract instance.
  //   const graviPoolNFT = await ethers.getContractAt("GraviPoolNFT", nftPoolAddress);

  //   // Retrieve auctioned NFT token IDs.
  //   const tokenIds = await graviPoolNFT.getAuctionedNFTs();
  //   console.log(`Auctioned NFTs for ${poolName}:`, tokenIds);

  //   // Loop through each token ID and print its auction details.
  //   for (const tokenId of tokenIds) {
  //     // Retrieve auction details for the given token.
  //     const auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
  //     console.log(`Auction details for token ${tokenId} in pool ${poolName}:`, auctionDetails);
  //   }
  // }
// }

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});