// scripts/nft/bid-for-nft.ts
import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const deploymentConfig = loadDeploymentConfig();
  const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
  const graviChaAddress = deploymentConfig["GraviCha"];
  if (!graviPoolNFTAddress || !graviChaAddress) {
    throw new Error("GraviPoolNFT or GraviCha address not found in deployment config.");
  }

  const graviCha = await ethers.getContractAt("IGraviCha", graviChaAddress);
  const graviPoolNFT = await ethers.getContractAt("GraviPoolNFT", graviPoolNFTAddress);

  // NFT token ID to place a bid on.
  const tokenId: string = "0";

  // Bid amount in charity tokens.
  const bidAmount = 1000n;

  // Show the current highest bid.
  let auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
  console.log(`Auction details for token ${tokenId}:`, auctionDetails);

  // APPROVAL STEP:
  // Approve the GraviDAO contract to spend (burn) the required charity tokens.
  console.log("Approving charity token spending...");
  const approveTx = await graviCha.approve(graviPoolNFTAddress, bidAmount);
  await approveTx.wait();
  console.log("Approval successful. Transaction hash:", approveTx.hash);

  // Bid for the NFT.
  console.log(`Placing a bid of ${bidAmount.toString()} tokens for NFT ${tokenId}...`);
  const tx = await graviPoolNFT.bid(tokenId, bidAmount);
  await tx.wait();
  console.log("Bid placed successfully. Transaction hash:", tx.hash);
  
  // Show the new highest bid.
  auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
  console.log(`Auction details for token ${tokenId}:`, auctionDetails);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
