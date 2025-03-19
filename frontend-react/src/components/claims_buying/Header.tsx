"use client";
import * as React from "react";
import { NavigationItem } from "./NavigationItem";
import { WalletButton } from "./WalletButton";

export const Header: React.FC = () => {
  const navItems = [
    "Claims",
    "Dashboard",
    "Buy Insurance",
    "Donate",
    "Governance",
  ];

  return (
    <header className="flex justify-between items-center p-6 bg-white border-b border-solid border-b-neutral-200 max-sm:p-4">
      <div className="flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3fb9b5d6a5bb2e6c792094834f99869333a63ef"
          className="w-10 h-[35px]"
          alt="Logo"
        />
      </div>
      <nav className="flex flex-1 gap-2 justify-end max-md:hidden">
        {navItems.map((item) => (
          <NavigationItem key={item} text={item} />
        ))}
      </nav>
      <WalletButton />
    </header>
  );
};
