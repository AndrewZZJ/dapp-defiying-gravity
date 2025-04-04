import React from "react";
import { ethers } from "ethers";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { NFTCard } from "./NFTCard";
import { DonorLeaderboard } from "./DonorLeaderboard";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

export default function NFTMarketplace() {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context

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
  const calculatePlaceholderEndDate = () => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 30);
    return currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // AJ: a backend method retrieving the NFT status for each pool.
  const nfts = [
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
      title: "Fire NFT",
      category: "Mythical",
      description: "Harness the eternal fire of the sun",
      altText: "Solar Flame",
      endDate: calculatePlaceholderEndDate(),
    },
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
      title: "Earthquake NFT",
      category: "Legendary",
      description: "Protects the blockchain realm from tremors",
      altText: "Earth Warden",
      endDate: calculatePlaceholderEndDate(),
    },
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/99c25429344972846f2eaa13689909934b39fdbc",
      title: "Flood NFT",
      category: "Epic",
      description: "A rare NFT of the elemental water guardian",
      altText: "Water Spirit",
      endDate: calculatePlaceholderEndDate(),
    },
  ];

  return (
    <main>
      <NavigationHeader />
      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {walletAddress ? (
          <>
            {nfts.map((nft, index) => (
              <NFTCard
                key={index}
                image={nft.image}
                title={nft.title}
                category={nft.category}
                description={nft.description}
                altText={nft.altText}
                endDate={nft.endDate}
                isWinner={index === 0} // Simulate the first NFT as won by the user. Please change these later
                hasBid={index !== 2} // Simulate the user has not bid on the third NFT. Please change these later
              />
            ))}
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">Please connect your wallet to view the marketplace.</p>
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