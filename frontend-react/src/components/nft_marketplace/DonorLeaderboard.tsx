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

  const leaderboardData = [
    { name: "0xA4...B21", amount: "1.2 ETH", nft: "Solar Flame" },
    { name: "🌊 water.eth", amount: "0.9 ETH", nft: "Water Spirit" },
    { name: "earthguardian.eth", amount: "0.75 ETH", nft: "Earth Warden" },
  ];

  return (
    <section
      ref={leaderboardRef}
      className={`transition-all duration-1000 ease-in-out blur-sm opacity-0 mt-32 mb-32 p-16 flex flex-col gap-8 bg-white rounded-xl max-w-3xl mx-auto ${
        isVisible ? "opacity-100 blur-0" : ""
      }`}          
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-zinc-900">
        Top Donors
      </h2>
      <ul className="space-y-4">
        {leaderboardData.map((entry, index) => (
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
    </section>
  );
};
