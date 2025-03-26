"use client";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";

interface ClaimItemProps {
  title: string;
  status: "Approved" | "Declined" | "In Progress";
  information?: string;
}

export const ClaimItem: React.FC<ClaimItemProps> = ({
  title,
  status,
  information,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusColor = {
    Approved: "text-green-600",
    Declined: "text-red-500",
    "In Progress": "text-yellow-500",
  };

  return (
    <div className="w-full max-w-full border border-zinc-300 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center w-full">
          {/* Title (left) */}
          <div className="text-lg font-medium text-stone-900 break-words">
            {title}
          </div>

          {/* Status + Chevron (right) */}
          <div className="flex items-center gap-2 ml-auto pl-8">
            <span className={`text-sm font-semibold ${statusColor[status]}`}>
              {status}
            </span>
            <span>
              {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </span>
          </div>
        </div>

        {/* Dropdown info section */}
        {isOpen && information && (
          <div className="pt-4 text-sm text-zinc-700 whitespace-pre-wrap break-words">
            {information}
          </div>
        )}
      </button>
    </div>
  );
};