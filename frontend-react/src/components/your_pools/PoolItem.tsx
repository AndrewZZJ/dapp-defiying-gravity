"use client";
import * as React from "react";

interface PoolItemProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const PoolItem: React.FC<PoolItemProps> = ({
  title,
  isExpanded,
  onToggle,
}) => {
  return (
    <section
      className={`flex items-center p-6 w-full rounded-lg border ${
        isExpanded ? "bg-white" : "bg-neutral-100"
      } border-neutral-200`}
    >
      <div className="flex flex-1 gap-2 items-center">
        <h3 className="flex-1 text-base font-bold leading-6 text-stone-900">
          {title}
        </h3>
        <button
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={`Toggle ${title}`}
        >
          {isExpanded ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[20px] h-[20px]"
            >
              <path
                d="M15 12.5L10 7.5L5 12.5"
                stroke="#1E1E1E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[20px] h-[20px]"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="#1E1E1E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
};
