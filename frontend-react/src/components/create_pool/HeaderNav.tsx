"use client";
import * as React from "react";
import { WalletButton } from "./WalletButton";

export const HeaderNav: React.FC = () => {
  const navItems = [
    "Claims",
    "Dashboard",
    "Buy Insurance",
    "Donate",
    "Governance",
  ];

  return (
    <header className="flex gap-6 items-center p-6 border-b border-solid bg-[color:var(--sds-color-background-default-default)] border-b-[color:var(--sds-color-border-default-default)] max-sm:flex-wrap max-sm:p-4">
      <div className="flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3fb9b5d6a5bb2e6c792094834f99869333a63ef"
          className="w-10 h-[35px]"
          alt="Logo"
        />
      </div>
      <nav className="flex flex-1 gap-2 justify-end max-md:flex-wrap max-sm:hidden">
        {navItems.map((item) => (
          <button
            key={item}
            className="p-2 text-base rounded-lg cursor-pointer text-stone-900"
          >
            {item}
          </button>
        ))}
      </nav>
      <WalletButton />
    </header>
  );
};
