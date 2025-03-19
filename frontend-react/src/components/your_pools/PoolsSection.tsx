"use client";
import * as React from "react";
import { PoolItem } from "./PoolItem";

export const PoolsSection: React.FC = () => {
  const [expandedPool, setExpandedPool] = React.useState<number>(0);

  return (
    <main className="flex flex-col items-center px-8 py-6 bg-neutral-100">
      <h1 className="text-7xl font-bold tracking-tighter text-center leading-[86.4px] text-neutral-950 max-md:text-6xl max-sm:text-4xl">
        Buy Insurance
      </h1>
      <nav className="flex mt-6 border border-neutral-200">
        <button className="px-3 py-1 text-3xl leading-10 border border-stone-300 text-neutral-500 max-md:text-2xl max-sm:text-xl">
          Pools
        </button>
        <button className="px-3 py-1 text-3xl leading-10 border border-zinc-800 text-zinc-800 max-md:text-2xl max-sm:text-xl">
          Your Pools
        </button>
      </nav>
      <div className="flex justify-end mt-0 w-full max-w-[1200px]">
        <button className="gap-2 p-3 text-base rounded-lg border bg-stone-900 border-stone-900 text-neutral-100">
          + Create Pool
        </button>
      </div>
      <div className="flex flex-col gap-12 items-center mt-12 w-full max-w-screen-sm">
        <div className="flex flex-col gap-4 items-start w-full">
          <PoolItem
            title="Your Pool 1"
            isExpanded={expandedPool === 1}
            onToggle={() => setExpandedPool(expandedPool === 1 ? 0 : 1)}
          />
          <PoolItem
            title="Your Pool 2"
            isExpanded={expandedPool === 2}
            onToggle={() => setExpandedPool(expandedPool === 2 ? 0 : 2)}
          />
        </div>
      </div>
    </main>
  );
};
