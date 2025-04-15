"use client";
import React, { useRef, useEffect, useState } from "react";

export const DonorLeaderboard: React.FC = () => {
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (leaderboardRef.current) observer.observe(leaderboardRef.current);

    return () => {
      if (leaderboardRef.current) observer.unobserve(leaderboardRef.current);
    };
  }, []);

  // AJ: a backend method getting highest bid from each pool 
  const highestBidsData = [
    { name: "0xA4...B21", amount: "1.2 GraviCha", nft: "Solar Flame" },
    { name: "0xV5...H15", amount: "0.9 GraviCha", nft: "Water Spirit" },
    { name: "0xL9...N87", amount: "0.75 GraviCha", nft: "Earth Warden" },
  ];

  // AJ: a backend method getting most recent bid from each pool (not sure the purpose of it)
  const recentBidsData = [
    { name: "0xB3...C12", amount: "0.5 GraviCha", nft: "Earth Warden" },
    { name: "0xW2...P17", amount: "0.3 GraviCha", nft: "Solar Flame" },
    { name: "0xD1...E34", amount: "0.2 GraviCha", nft: "Water Spirit" },
  ];

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
        <ul className="space-y-4">
          {highestBidsData.map((entry, index) => (
            <li
              key={index}
              className="flex justify-between border-b pb-2 text-sm sm:text-base"
            >
              <span>{entry.name}</span>
              <span className="text-emerald-700 font-semibold">
                {entry.amount}
              </span>
              <span className="italic text-zinc-600">{entry.nft}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Most Recent Bids Leaderboard */}
      {/* This is just a template. Please update this later. */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-6 text-center text-zinc-900">
          Most Recent Bids
        </h2>
        <ul className="space-y-4">
          {recentBidsData.map((entry, index) => (
            <li
              key={index}
              className="flex justify-between border-b pb-2 text-sm sm:text-base"
            >
              <span>{entry.name}</span>
              <span className="text-emerald-700 font-semibold">
                {entry.amount}
              </span>
              <span className="italic text-zinc-600">{entry.nft}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};