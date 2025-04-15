"use client";
import React from "react";
import { useWallet } from "../../context/WalletContext";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { ClaimsHeader } from "../claims_buying/ClaimsHeader";
import { ClaimsList } from "./ClaimsList";

export const ClaimsPage = () => {
  const { walletAddress } = useWallet();
  
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <main className="w-full min-h-screen bg-white">
        <NavigationHeader />
        <section className="flex flex-col items-center p-6 bg-gray-50 min-h-[782px]">
          <ClaimsHeader />
          {/* Only render ClaimsList if wallet is connected */}
          {walletAddress && <ClaimsList />}
        </section>
      </main>
    </>
  );
};

export default ClaimsPage;