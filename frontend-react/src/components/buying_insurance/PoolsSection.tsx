"use client";
import React, { useState } from "react";
import { PoolItem } from "./PoolItem";

const tabs = ["Pools", "Your Pools"];
const poolItems = [
  "Unity Cover",
  "GraviTrust Foundation",
  "Title",
  "Title",
  "Title",
];

export const PoolsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Buy Insurance
      </h1>

      <nav className="flex justify-center mb-8 max-sm:flex-col max-sm:items-center">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`px-3 py-1 text-3xl rounded-2xl border-b border-solid border-b-[color:var(--sds-color-border-neutral-tertiary)] max-sm:w-full max-sm:text-2xl max-sm:text-center ${
              activeTab === index ? "border-b-black" : ""
            }`}
            onClick={() => setActiveTab(index)}
            aria-selected={activeTab === index}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {poolItems.map((pool, index) => (
          <PoolItem key={index} title={pool} />
        ))}
      </section>
    </main>
  );
};
