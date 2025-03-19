"use client";
import React, { useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

interface PoolItemProps {
  title: string;
}

export const PoolItem: React.FC<PoolItemProps> = ({ title }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      className="flex items-center p-4 rounded-lg border border-solid bg-[color:var(--sds-color-background-default-secondary)] border-[color:var(--sds-color-border-default-default)] w-full hover:bg-gray-50 transition-colors max-sm:p-3"
      onClick={() => setIsExpanded(!isExpanded)}
      aria-expanded={isExpanded}
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-base font-bold text-stone-900">{title}</span>
        <span className="flex items-center">
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </div>
    </button>
  );
};
