"use client";
import * as React from "react";

interface Tab {
  id: string;
  label: string;
}

export const ClaimsHeader: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("covers");

  const tabs: Tab[] = [
    { id: "covers", label: "Your Covers" },
    { id: "buy", label: "Buy Covers" },
  ];

  return (
    <section className="flex flex-col items-center">
      <h1 className="mb-8 text-7xl font-bold text-neutral-950 max-md:text-5xl max-sm:text-4xl">
        Claims
      </h1>
      <div className="flex gap-4 mb-8 max-md:flex-col">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-3xl border-b border-solid cursor-pointer border-b-neutral-200 text-neutral-500 max-sm:text-2xl
              ${activeTab === tab.id ? "border-b-neutral-950" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
};
