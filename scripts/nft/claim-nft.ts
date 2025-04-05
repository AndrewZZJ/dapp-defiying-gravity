// scripts/nft/claim-nft.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  // 1. Load addresses from the deployment config
  const deploymentConfig = loadDeploymentConfig();
  const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
  if (!graviPoolNFTAddress) {
    throw new Error("GraviPoolNFT address not found in deployment config.");
  }

  // 2. Get the connected signer (assumed to be the highest bidder)
  //    If you're using a specific private key or account, be sure
  //    to configure it in hardhat.config.ts or pass it via CLI.
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${await signer.getAddress()}`);

  // 3. Get an instance of the GraviPoolNFT contract
  const graviPoolNFT = await ethers.getContractAt("GraviPoolNFT", graviPoolNFTAddress);

  // 4. Specify which token ID to claim. 
  //    This should be the same ID you placed a bid on previously, 
  //    and for which you are the highest bidder.
  const tokenId = "0"; // Example: "0"

  // 5. Check the auction details
  console.log(`Fetching auction details for token ${tokenId}...`);
  const auctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
  console.log("Auction Details:", {
    tokenId: auctionDetails[0].toString(),
    highestBidder: auctionDetails[1],
    highestBid: auctionDetails[2].toString(),
    ended: auctionDetails[3],
    startTime: auctionDetails[4].toString(),
  });

  // 6. The actual claim transaction (requires the auction to have ended).
  //    This will burn the highest bid tokens and transfer the NFT to the highest bidder.
  console.log(`Claiming NFT (tokenId: ${tokenId})...`);
  const tx = await graviPoolNFT.claimNFT(tokenId);
  await tx.wait();
  console.log(`NFT claimed successfully! Tx hash: ${tx.hash}`);

  // 7. Verify that the auction has ended and you are now the owner of the token.
  const updatedAuctionDetails = await graviPoolNFT.getAuctionDetails(tokenId);
  console.log("Updated Auction Details:", {
    tokenId: updatedAuctionDetails[0].toString(),
    highestBidder: updatedAuctionDetails[1],
    highestBid: updatedAuctionDetails[2].toString(),
    ended: updatedAuctionDetails[3],
    startTime: updatedAuctionDetails[4].toString(),
  });

  // 8. Check the new owner of the token
  const newOwner = await graviPoolNFT.ownerOf(tokenId);
  console.log(`New owner of token ${tokenId} is: ${newOwner}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
