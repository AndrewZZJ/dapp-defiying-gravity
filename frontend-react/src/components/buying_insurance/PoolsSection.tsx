"use client";
import React, { useState } from "react";

interface PoolItemProps {
  title: string;
  purchased: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onPurchase: () => void;
  color: string; // Add a color prop for dynamic background color
}

const PoolItem: React.FC<PoolItemProps> = ({ title, purchased, isOpen, onToggle, onPurchase, color }) => {
  return (
    <div
      className={`border border-zinc-300 rounded-lg shadow-sm ${
        purchased ? `${color} text-white` : "bg-white"
      }`}
    >
      {/* Button to toggle dropdown */}
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full p-4 text-left ${
          purchased ? "text-white" : "text-black"
        }`}
      >
        <div className="text-lg font-medium">
          {title} {purchased && <span>(Purchased)</span>}
        </div>
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className={`px-4 pb-4 text-sm ${purchased ? "text-white" : "text-zinc-700"}`}>
          <p>Purchase insurance against {title.toLowerCase()}s.</p>
          <button
            onClick={onPurchase}
            className="mt-2 px-4 py-2 text-white bg-green-700 rounded-lg hover:bg-green-800"
          >
            Buy
          </button>
        </div>
      )}
    </div>
  );
};

export const PoolsSection: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string[]>([]);

  const handleToggle = (item: string) => {
    setSelected(selected === item ? null : item);
  };

  const handlePurchase = (item: string) => {
    if (!purchased.includes(item)) {
      setPurchased([...purchased, item]);
    }
  };

  const poolItems = [
    { title: "Wildfire", color: "bg-orange-500" }, // Sunset orange
    { title: "Flood", color: "bg-blue-300" }, // Light baby blue
    { title: "Earthquake", color: "bg-tan-500" }, // Muted tan (custom color)
  ];

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Buy Insurance
      </h1>

      <section className="flex flex-col gap-6 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {poolItems.map((item) => (
          <PoolItem
            key={item.title}
            title={item.title}
            purchased={purchased.includes(item.title)}
            isOpen={selected === item.title}
            onToggle={() => handleToggle(item.title)}
            onPurchase={() => handlePurchase(item.title)}
            color={item.color} // Pass the color dynamically
          />
        ))}
      </section>
    </main>
  );
};