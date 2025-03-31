"use client";
import * as React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { HeroSection } from "./HeroSection";
import { LoginCard } from "./LoginCard";
import { Dashboard } from "./Dashboard"; // Import the Dashboard component

export default function GraviTrustLanding() {
  const [walletConnected, setWalletConnected] = React.useState(false);

  // Callback to handle wallet connection
  const handleWalletConnected = () => {
    setWalletConnected(true);
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-[screen]">
      <NavigationHeader />
      <HeroSection />
      <main className="flex justify-center items-center p-16 max-md:p-12 max-sm:p-8">
        {walletConnected ? (
          <Dashboard /> // Show the Dashboard if the wallet is connected
        ) : (
          <LoginCard onWalletConnected={handleWalletConnected} /> // Pass the callback to LoginCard
        )}
      </main>
    </div>
  );
}