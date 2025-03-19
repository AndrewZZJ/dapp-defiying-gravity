import React from "react";
import { NavigationItems } from "./NavigationItems";
import { WalletConnectButton } from "./WalletConnectButton";

export const NavigationHeader: React.FC = () => {
  return (
    <header className="flex gap-6 items-center p-8 bg-white border border">
      <div className="flex gap-6 items-center">
        <img
          src="https://placehold.co/40x35/1e1e1e/1e1e1e"
          alt="Logo"
          className="w-[40px] h-[35px]"
        />
      </div>
      <NavigationItems />
      <WalletConnectButton />
    </header>
  );
};
