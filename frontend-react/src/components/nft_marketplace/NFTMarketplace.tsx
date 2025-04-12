import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { NFTCard } from "./NFTCard";
import { DonorLeaderboard } from "./DonorLeaderboard";
import { useWallet } from "../../context/WalletContext";
import GraviPoolNFTABI from "../../artifacts/contracts/tokens/GraviPoolNFT.sol/GraviPoolNFT.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";

interface NFT {
  id: number;
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string; // Full ISO string (auction end time)
  isWinner: boolean;
  ended: boolean; // on-chain ended flag (true if NFT already claimed)
  highestBid?: string; // Formatted in GraviCha units.
  highestBidder?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export default function NFTMarketplace() {
  const { walletAddress, setWalletAddress } = useWallet();
  const [activeBids, setActiveBids] = useState<NFT[]>([]);
  const [pastBids, setPastBids] = useState<NFT[]>([]);
  const [withdrawable, setWithdrawable] = useState<string>("0");

  // Connect wallet.
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        getNFTAuctionStatus();
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  const fetchNFTData = async (
    tokenURIs: { tokenId: string; tokenURI: string }[]
  ) => {
    try {
      const nftData = await Promise.all(
        tokenURIs.map(async ({ tokenId, tokenURI }) => {
          const response = await fetch(tokenURI);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch NFT data from ${tokenURI}: ${response.statusText}`
            );
          }
          const nftJson = await response.json();
          return {
            id: tokenId,
            name: nftJson.name,
            description: nftJson.description,
            image: nftJson.image,
            attributes: nftJson.attributes,
          };
        })
      );
      return nftData;
    } catch (error) {
      console.error("Failed to fetch NFT data:", error);
      return [];
    }
  };

  const getNFTAuctionStatus = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    try {
      // Get current time from latest block.
      const latestBlock = await provider.getBlock("latest");
      const now = new Date(latestBlock.timestamp * 1000);

      const response = await fetch("/addresses.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses.json: ${response.statusText}`);
      }
      const deploymentConfig = await response.json();
      const graviGovAddress = deploymentConfig["GraviGov"];
      const graviChaAddress = deploymentConfig["GraviCha"];
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviGovAddress || !graviChaAddress || !graviPoolNFTAddress) {
        throw new Error("Required addresses not found in addresses.json.");
      }

      // Instantiate GraviPoolNFT contract.
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        provider
      );

      // Fetch withdrawable amount for the current user.
      if (walletAddress) {
        // Need the signer to call withdrawableAmount.
        const signer = provider.getSigner();
        const userGraviPoolNFT = new ethers.Contract(
          graviPoolNFTAddress,
          GraviPoolNFTABI.abi,
          signer
        );
        // Fetch the withdrawable amount.
        const pending = await userGraviPoolNFT.withdrawableAmount();
        const pendingFormatted = ethers.utils.formatUnits(pending, 18);

        // // For not set pending amount, set it to 0.
        // const pendingFormatted = "1.0";
        console.log("Pending amount:", pendingFormatted);
        setWithdrawable(pendingFormatted);
      }

      const tokenIds = await graviPoolNFT.getAuctionedNFTs();

      const tokenURIs = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const tokenURI = await graviPoolNFT.tokenURI(tokenId);
          return { tokenId: tokenId.toString(), tokenURI };
        })
      );

      const tokenDetails = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const details = await graviPoolNFT.getAuctionDetails(tokenId);
          return { tokenId: tokenId.toString(), details };
        })
      );

      const nftData = await fetchNFTData(tokenURIs);
      // Auction duration: 7 days (milliseconds)
      const auctionDuration = 7 * 24 * 60 * 60 * 1000;

      const mergedNFTs: NFT[] = nftData.map((nft, index) => {
        const detail = tokenDetails[index].details;
        // Compute auction start time.
        const auctionStartTime = new Date(detail.startTime.toNumber() * 1000);
        // Calculate auction end time.
        const calculatedEndDate = new Date(auctionStartTime.getTime() + auctionDuration);
        // Use full ISO string for endDate.
        const endDate = calculatedEndDate.toISOString();
        // The on-chain "ended" flag indicates if claimed.
        const ended = detail.ended;
        // Determine isWinner: if auction time has passed and wallet matches highestBidder.
        const isWinner: boolean =
          now > calculatedEndDate && walletAddress
            ? detail.highestBidder.toLowerCase() === walletAddress.toLowerCase()
            : false;
        const highestBid = ethers.utils.formatUnits(detail.highestBid, 18);
        const highestBidder = detail.highestBidder;

        let category = "";
        if (nft.attributes && Array.isArray(nft.attributes)) {
          const elementAttr = nft.attributes.find(
            (attr: any) => attr.trait_type === "Element"
          );
          if (elementAttr) {
            category = elementAttr.value;
          }
        }

        return {
          id: parseInt(nft.id),
          image: nft.image,
          title: nft.name,
          description: nft.description,
          attributes: nft.attributes,
          highestBid,
          highestBidder,
          category,
          altText: nft.name,
          endDate,
          isWinner,
          ended, // on-chain claimed flag
        };
      });

      const active = mergedNFTs.filter((nft) => new Date(nft.endDate) > now);
      // const past = mergedNFTs.filter((nft) => new Date(nft.endDate) <= now);
      const past = mergedNFTs
        .filter((nft) => new Date(nft.endDate) <= now)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      setActiveBids(active);
      setPastBids(past);
    } catch (error) {
      console.error("Error fetching NFT auction status:", error);
    }
  };

  const handleBidForNFT = async (nftId: number, bidValue: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      const graviChaAddress = deploymentConfig["GraviCha"];
      if (!graviPoolNFTAddress || !graviChaAddress) {
        throw new Error("Required contract addresses not found");
      }
      const graviCha = new ethers.Contract(graviChaAddress, GraviChaABI.abi, signer);
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      const parsedBidAmount = ethers.utils.parseUnits(bidValue, "ether");
      console.log("Approving charity token spending...");
      const approveTx = await graviCha.approve(graviPoolNFTAddress, parsedBidAmount);
      await approveTx.wait();
      console.log("Approval successful. Tx hash:", approveTx.hash);
      console.log(`Placing a bid of ${bidValue} tokens for NFT ${nftId}...`);
      const bidTx = await graviPoolNFT.bid(nftId, parsedBidAmount);
      await bidTx.wait();
      alert("Bid submitted successfully!");
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Bid failed!");
    }
  };

  const handleClaimNFT = async (nftId: number) => {
    if (!walletAddress) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviPoolNFTAddress) throw new Error("GraviPoolNFT address not found");
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      console.log(`Claiming NFT (tokenId: ${nftId})...`);
      const claimTx = await graviPoolNFT.claimNFT(nftId);
      await claimTx.wait();
      alert("NFT claimed successfully!");
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error claiming NFT:", error);
      alert("Claim NFT failed!");
    }
  };

  const handleReclaimTokens = async (nftId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviPoolNFTAddress) throw new Error("GraviPoolNFT address not found");
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      const tx = await graviPoolNFT.withdraw();
      await tx.wait();
      alert("Tokens reclaimed successfully!");
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      alert("Token withdrawal failed!");
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getNFTAuctionStatus();
      const interval = setInterval(getNFTAuctionStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  return (
    <main>
      <NavigationHeader />
      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {walletAddress ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Active Bids</h2>
            {activeBids.length > 0 ? (
              activeBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  currentUserAddress={walletAddress}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  auctionEnded={false}
                  auctionClaimed={nft.ended}
                  isWinner={nft.isWinner}
                  hasBid={true}
                  highestBid={nft.highestBid}
                  highestBidder={nft.highestBidder}
                  onBid={(bidValue: string) => handleBidForNFT(nft.id, bidValue)}
                  onClaimNFT={nft.isWinner ? () => handleClaimNFT(nft.id) : undefined}
                  onReclaimTokens={
                    !nft.isWinner ? () => handleReclaimTokens(nft.id) : undefined
                  }
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No active bids available.</p>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mt-12">Past Bids</h2>
            {pastBids.length > 0 ? (
              pastBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  currentUserAddress={walletAddress}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  auctionEnded={true}
                  auctionClaimed={nft.ended}
                  isWinner={nft.isWinner}
                  hasBid={true}
                  highestBid={nft.highestBid}
                  highestBidder={nft.highestBidder}
                  onClaimNFT={nft.isWinner ? () => handleClaimNFT(nft.id) : undefined}
                  onReclaimTokens={
                    !nft.isWinner ? () => handleReclaimTokens(nft.id) : undefined
                  }
                  withdrawable={withdrawable}
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No past bids available.</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">
              Please connect your wallet to view auctions.
            </p>
            <button
              onClick={connectWallet}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </section>
      {walletAddress && <DonorLeaderboard />}
    </main>
  );
}