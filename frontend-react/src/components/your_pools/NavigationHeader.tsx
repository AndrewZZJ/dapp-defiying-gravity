"use client";
import * as React from "react";
import { NavigationItem } from "./NavigationItem";
import { WalletButton } from "./WalletButton";

export const NavigationHeader: React.FC = () => {
  return (
    <header className="flex gap-6 items-center p-8 bg-white border border-neutral-200">
      <div className="flex gap-6 items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3fb9b5d6a5bb2e6c792094834f99869333a63ef"
          alt="Logo"
          className="w-[40px] h-[35px]"
        />
      </div>
      <nav className="flex flex-wrap flex-1 gap-2 justify-end items-start max-sm:hidden">
        <NavigationItem label="Claims" isActive={true} />
        <NavigationItem label="Dashboard" />
        <NavigationItem label="Buy Insurance" />
        <NavigationItem label="Donate" />
        <NavigationItem label="Governance" />
      </nav>
      <button className="p-2" aria-label="Menu">
        <svg
          className="w-[24px] h-[24px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
        </svg>
      </button>
      <WalletButton />
    </header>
  );
};
