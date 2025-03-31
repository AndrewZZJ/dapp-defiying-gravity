"use client";
import * as React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { NFTCard } from "./NFTCard";
import { DonorLeaderboard } from "./DonorLeaderboard";

export default function NFTMarketplace() {
  const nfts = [
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
      title: "Fire NFT",
      category: "Mythical",
      description: "Harness the eternal fire of the sun",
      altText: "Solar Flame",
    },
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
      title: "Earthquake NFT",
      category: "Legendary",
      description: "Protects the blockchain realm from tremors",
      altText: "Earth Warden",
    },
    {
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/99c25429344972846f2eaa13689909934b39fdbc",
      title: "Flood NFT",
      category: "Epic",
      description: "A rare NFT of the elemental water guardian",
      altText: "Water Spirit",
    },
  ];

  return (
    <main>
      <NavigationHeader />
      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {nfts.map((nft, index) => (
          <NFTCard
            key={index}
            image={nft.image}
            title={nft.title}
            category={nft.category}
            description={nft.description}
            altText={nft.altText}
          />
        ))}
      </section>
      <DonorLeaderboard />
    </main>
  );
}
