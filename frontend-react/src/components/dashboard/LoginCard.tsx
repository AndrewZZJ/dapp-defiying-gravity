import React from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import { Dashboard } from "./Dashboard"; // Import the Dashboard component

const LoginIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-[32px] h-[32px] flex-shrink-0"
  >
    <path
      d="M20 4H25.3333C26.0406 4 26.7189 4.28095 27.219 4.78105C27.719 5.28115 28 5.95942 28 6.66667V25.3333C28 26.0406 27.719 26.7189 27.219 27.219C26.7189 27.719 26.0406 28 25.3333 28H20M13.3333 22.6667L20 16M20 16L13.3333 9.33333M20 16H4"
      stroke="#1E1E1E"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface LoginCardProps {
  onWalletConnected: () => void; // Callback function to notify parent
}

export const LoginCard: React.FC<LoginCardProps> = ({ onWalletConnected }) => {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address); // Update global wallet state

        // Notify parent component that the wallet is connected
        onWalletConnected();
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  // If the wallet is already connected, show the dashboard overview
  if (walletAddress) {
    return <Dashboard />;
  }

  // Otherwise, show the login card with the connect wallet button
  return (
    <article className="flex gap-6 items-start p-6 bg-white rounded-lg border border w-[588px] max-sm:w-full">
      <LoginIcon />
      <div className="flex flex-col flex-1 gap-4 items-start">
        <div className="flex flex-col gap-2 items-start w-full">
          <h2 className="w-full text-2xl font-bold tracking-tight leading-7 text-center text-stone-900">
            Crowd-sourced Insurance
          </h2>
          <p className="w-full text-base leading-6 text-center text-neutral-500">
            Please connect your wallet to continue.
          </p>
        </div>
        <div className="flex gap-4 items-center w-full">
          <button
            onClick={connectWallet}
            className="flex-1 gap-2 p-3 text-base leading-4 bg-gray-50 rounded-lg border border text-stone-900"
          >
            Connect your wallet
          </button>
        </div>
      </div>
    </article>
  );
};