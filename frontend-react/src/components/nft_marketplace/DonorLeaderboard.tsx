"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";

interface LeaderboardEntry {
  name: string;
  amount: string;
  nft: string;
}

interface NFTBid {
  id: number;
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string;
  isWinner: boolean;
  nftClaimed: boolean;
  highestBid?: string;
  highestBidder?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface DonorLeaderboardProps {
  pastBids?: NFTBid[];
  useMockData?: boolean;
}

export const DonorLeaderboard: React.FC<DonorLeaderboardProps> = ({ 
  pastBids = [], 
  useMockData = false 
}) => {
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Mock data for testing - defined outside of the component body to prevent re-creation
  const mockHighestBidsData: LeaderboardEntry[] = useMemo(() => [
    { name: "0xA4...B21", amount: "1.2 GraviCha", nft: "Solar Flame" },
    { name: "0xV5...H15", amount: "0.9 GraviCha", nft: "Water Spirit" },
    { name: "0xL9...N87", amount: "0.75 GraviCha", nft: "Earth Warden" },
  ], []);

  const mockRecentBidsData: LeaderboardEntry[] = useMemo(() => [
    { name: "0xB3...C12", amount: "0.5 GraviCha", nft: "Earth Warden" },
    { name: "0xW2...P17", amount: "0.3 GraviCha", nft: "Solar Flame" },
    { name: "0xD1...E34", amount: "0.2 GraviCha", nft: "Water Spirit" },
  ], []);

  // Helper function to shorten wallet addresses
  const shortenAddress = (address: string): string => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Process actual auction data with useMemo to prevent recalculation on every render
  const { highestBids, recentBids } = useMemo(() => {
    // Only use mock data when explicitly requested
    if (useMockData) {
      return {
        highestBids: mockHighestBidsData,
        recentBids: mockRecentBidsData
      };
    }

    // Process highest bids (sort by bid amount descending)
    const processedHighestBids = [...pastBids]
      .filter(bid => bid.highestBid && bid.highestBidder)
      .sort((a, b) => {
        const bidA = parseFloat(a.highestBid || '0');
        const bidB = parseFloat(b.highestBid || '0');
        return bidB - bidA;
      })
      .slice(0, 5) // Take top 5
      .map(bid => ({
        name: shortenAddress(bid.highestBidder || ''),
        amount: `${bid.highestBid} GraviCha`,
        nft: bid.title
      }));

    // Process most recent bids (sort by end date descending)
    const processedRecentBids = [...pastBids]
      .filter(bid => bid.highestBid && bid.highestBidder)
      .sort((a, b) => {
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      })
      .slice(0, 5) // Take 5 most recent
      .map(bid => ({
        name: shortenAddress(bid.highestBidder || ''),
        amount: `${bid.highestBid} GraviCha`,
        nft: bid.title
      }));

    return {
      highestBids: processedHighestBids,
      recentBids: processedRecentBids
    };
  }, [pastBids, useMockData, mockHighestBidsData, mockRecentBidsData]);

  // Setup intersection observer with proper dependency array
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting !== isVisible) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = leaderboardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // Empty dependency array - we only want to set up the observer once

  return (
    <section
      ref={leaderboardRef}
      className={`transition-all duration-1000 ease-in-out blur-sm opacity-0 mt-32 mb-32 p-16 flex flex-col md:flex-row gap-24 bg-white rounded-xl max-w-6xl mx-auto ${
        isVisible ? "opacity-100 blur-0" : ""
      }`}
    >
      {/* Highest Historical Bids Leaderboard */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-6 text-center text-zinc-900">
          Highest Historical Bids
        </h2>
        {highestBids.length > 0 ? (
          <ul className="space-y-4">
            {highestBids.map((entry, index) => (
              <li
                key={index}
                className="flex justify-between border-b pb-2 text-sm sm:text-base"
              >
                <span className="flex-1">{entry.name}</span>
                <span className="flex-1 text-emerald-700 font-semibold text-center">
                  {entry.amount}
                </span>
                <span className="flex-1 italic text-zinc-600 text-right">{entry.nft}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 italic">No auction ended yet</p>
        )}
      </div>

      {/* Most Recent Bids Leaderboard */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-6 text-center text-zinc-900">
          Most Recent Bids
        </h2>
        {recentBids.length > 0 ? (
          <ul className="space-y-4">
            {recentBids.map((entry, index) => (
              <li
                key={index}
                className="flex justify-between border-b pb-2 text-sm sm:text-base"
              >
                <span className="flex-1">{entry.name}</span>
                <span className="flex-1 text-emerald-700 font-semibold text-center">
                  {entry.amount}
                </span>
                <span className="flex-1 italic text-zinc-600 text-right">{entry.nft}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 italic">No auction ended yet</p>
        )}
      </div>
    </section>
  );
};