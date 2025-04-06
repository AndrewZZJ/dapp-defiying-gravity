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

  // // Retrieve the number of NFTs owned by the deployer (or any address you specify).
  console.log("\nRetrieving NFTs owned by the NFT contract"); 
  const { balance, tokens } = await getOwnerNFTs(graviPoolNFT, graviPoolNFTAddress);
  console.log("Balance:", balance);
  console.log("Token IDs:", tokens);

  // Print the URL for each token ID.
  for (const tokenId of tokens) {
    const tokenURI = await graviPoolNFT.tokenURI(tokenId);
    console.log(`Token ID ${tokenId} URI:`, tokenURI);
  }

  // Print the deployer's owned NFTs.
  console.log("\nRetrieving NFTs owned by the deployer");
  const ownerAddress = await deployer.getAddress();
  const { balance: ownerBalance, tokens: ownerTokens } = await getOwnerNFTs(graviPoolNFT, ownerAddress);
  console.log("Owner's Balance:", ownerBalance);
  console.log("Owner's Token IDs:", ownerTokens);
  for (const tokenId of ownerTokens) {
    const tokenURI = await graviPoolNFT.tokenURI(tokenId);
    console.log(`Owner's Token ID ${tokenId} URI:`, tokenURI);
  }


  return { balance, tokens };

  // const sentLogs = await graviPoolNFT.queryFilter(
  //   graviPoolNFT.filters.Transfer(ownerAddress, undefined),
  // );
  // const receivedLogs = await graviPoolNFT.queryFilter(
  //   graviPoolNFT.filters.Transfer(undefined, ownerAddress),
  // );

  // const logs = sentLogs.concat(receivedLogs)
  //   .sort(
  //     (a, b) =>
  //       a.blockNumber - b.blockNumber ||
  //       a.transactionIndex - b.transactionIndex,
  //   );

  // const owned = new Set();

  // for (const { args: { from, to, tokenId } } of logs) {
  //   if (addressEqual(to, ownerAddress)) {
  //     owned.add(tokenId.toString());
  //   } else if (addressEqual(from, ownerAddress)) {
  //     owned.delete(tokenId.toString());
  //   }
  // }
  // console.log(`Owner's NFTs:`, Array.from(owned));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function getOwnerNFTs(graviPoolNFT: any, ownerAddress: string): Promise<{ balance: string, tokens: string[] }> {
  // Retrieve the NFT balance for the given address.
  const balance = await graviPoolNFT.balanceOf(ownerAddress);
  console.log(`Owner's NFT balance:`, balance.toString());

  // Get all transfer logs where the address is the sender and receiver.
  const sentLogs = await graviPoolNFT.queryFilter(
    graviPoolNFT.filters.Transfer(ownerAddress, undefined)
  );
  const receivedLogs = await graviPoolNFT.queryFilter(
    graviPoolNFT.filters.Transfer(undefined, ownerAddress)
  );

  // Combine and sort logs by block number and transaction index.
  const logs = sentLogs.concat(receivedLogs).sort(
    (a: { blockNumber: number; transactionIndex: number; }, b: { blockNumber: number; transactionIndex: number; }) =>
      a.blockNumber - b.blockNumber ||
      a.transactionIndex - b.transactionIndex,
  );

  // Process logs to determine the tokens currently owned.
  const owned = new Set<string>();
  for (const { args: { from, to, tokenId } } of logs) {
    if (addressEqual(to, ownerAddress)) {
      owned.add(tokenId.toString());
    } else if (addressEqual(from, ownerAddress)) {
      owned.delete(tokenId.toString());
    }
  }
  console.log(`Owner's NFTs:`, Array.from(owned));

  return {
    balance: balance.toString(),
    tokens: Array.from(owned),
  };
}

function addressEqual(to: string, account: string): boolean {
  return to.toLowerCase() === account.toLowerCase();
}