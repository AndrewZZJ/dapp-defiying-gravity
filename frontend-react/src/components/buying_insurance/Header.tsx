import React from "react";
import { NavigationLinks } from "./NavigationLinks";
import { WalletButton } from "./WalletButton";

export const Header: React.FC = () => {
  return (
    <header className="flex gap-6 items-center p-8 border-b border-solid bg-[color:var(--sds-color-background-default-default)] border-b-[color:var(--sds-color-border-default-default)] max-md:flex-wrap max-md:p-4 max-sm:p-3">
      <div className="flex gap-6 items-center">
        <div className="w-10 h-[35px]" aria-label="Logo placeholder" />
      </div>
      <NavigationLinks />
      <WalletButton />
    </header>
  );
};
