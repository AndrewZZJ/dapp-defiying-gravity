"use client";
import React from "react";
import { DollarIcon } from "./Icons";

export const WalletButton: React.FC = () => {
  return (
    <button
      className="flex gap-2 items-center p-3 rounded-lg border-solid bg-[color:var(--sds-color-background-default-default)] border-[3px] border-[color:var(--sds-color-border-brand-default)] hover:opacity-90 transition-opacity"
      aria-label="Connect wallet"
    >
      <DollarIcon />
      <span className="text-base text-zinc-800">Connect your wallet</span>
    </button>
  );
};
