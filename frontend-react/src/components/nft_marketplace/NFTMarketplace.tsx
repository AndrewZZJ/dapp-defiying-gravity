import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { NFTCard } from "./NFTCard";
import { DonorLeaderboard } from "./DonorLeaderboard";
import { useWallet } from "../../context/WalletContext";

// Define the NFT type
interface NFT {
  id: number;
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string; // Auction end date as a string
  isWinner: boolean; // Whether the user is the winner
}

export default function NFTMarketplace() {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context
  const [activeBids, setActiveBids] = useState<NFT[]>([]); // Array of NFT objects
  const [pastBids, setPastBids] = useState<NFT[]>([]); // Array of NFT objects

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as ethers.providers.ExternalProvider
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address); // Update global wallet state
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  // AJ: need to be deleted when we have the following backend method retrieving the status of bidding.
  const calculatePlaceholderEndDate = (daysFromNow: number) => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysFromNow);
    return currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // AJ: a backend method retrieving the NFT status for each pool.
  const allNFTs: NFT[] = [
    {
      id: 1,
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
      title: "Fire NFT",
      category: "Mythical",
      description: "Harness the eternal fire of the sun",
      altText: "Solar Flame",
      endDate: calculatePlaceholderEndDate(-1), // Auction ended
      isWinner: true, // Simulate winning bid
    },
    {
      id: 2,
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
      title: "Earthquake NFT",
      category: "Legendary",
      description: "Protects the blockchain realm from tremors",
      altText: "Earth Warden",
      endDate: calculatePlaceholderEndDate(5), // Auction still active
      isWinner: false,
    },
    {
      id: 3,
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/99c25429344972846f2eaa13689909934b39fdbc",
      title: "Flood NFT",
      category: "Epic",
      description: "A rare NFT of the elemental water guardian",
      altText: "Water Spirit",
      endDate: calculatePlaceholderEndDate(-2), // Auction ended
      isWinner: false, // Simulate losing bid
    },
  ];

  // Separate active and past bids
  useEffect(() => {
    const now = new Date();
    const active = allNFTs.filter((nft) => new Date(nft.endDate) > now);
    const past = allNFTs.filter((nft) => new Date(nft.endDate) <= now);
    setActiveBids(active);
    setPastBids(past);
  }, []);

  const handleClaimNFT = (nftId: number) => {
    alert(`Claiming NFT with ID: ${nftId}`);
    // Add logic to interact with the smart contract to claim the NFT (Check NFTCard.tsx for more details)
  };

  const handleReclaimTokens = (nftId: number) => {
    alert(`Reclaiming tokens for NFT with ID: ${nftId}`);
    // Add logic to interact with the smart contract to reclaim tokens (Check NFTCard.tsx for more details)
  };

  return (
    <main>
      <NavigationHeader />
      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {walletAddress ? (
          <>
            {/* Active Bids Section */}
            <h2 className="text-2xl font-bold text-gray-900">Active Bids</h2>
            {activeBids.length > 0 ? (
              activeBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  isWinner={nft.isWinner}
                  hasBid={true} // Assume the user has bid for simplicity
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No active bids available.</p>
            )}

            {/* Past Bids Section */}
            <h2 className="text-2xl font-bold text-gray-900 mt-12">Past Bids</h2>
            {pastBids.length > 0 ? (
              pastBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  isWinner={nft.isWinner}
                  hasBid={true} // Assume the user has bid for simplicity
                  onClaimNFT={nft.isWinner ? () => handleClaimNFT(nft.id) : undefined}
                  onReclaimTokens={!nft.isWinner ? () => handleReclaimTokens(nft.id) : undefined}
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No past bids available.</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">Please connect your wallet to view auctions.</p>
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