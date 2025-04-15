import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";

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

export const ClaimsHeader = () => {
  const { walletAddress, setWalletAddress } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setConnecting(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      } finally {
        setConnecting(false);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl">
      <h1 className="mb-8 text-7xl font-bold tracking-tighter text-neutral-950 max-sm:text-5xl">
        Claims
      </h1>
      
      {walletAddress ? (
        // Show navigation when wallet is connected
        <nav className="flex gap-4 mb-8 max-sm:flex-col max-sm:items-center">
          <Link
            to="/claims-covered"
            className="px-3 py-1 text-3xl border-b border-solid cursor-pointer border-b-neutral-500 text-neutral-500 max-sm:text-2xl hover:text-neutral-700"
          >
            View Claims
          </Link>
          <Link
            to="/claims-buying"
            className="px-3 py-1 text-3xl border-b border-solid cursor-pointer border-b-neutral-500 text-neutral-500 max-sm:text-2xl hover:text-neutral-700"
          >
            Submit Claim
          </Link>
        </nav>
      ) : (
        // Show login card when wallet is not connected
        <article className="flex gap-6 items-start p-6 bg-white rounded-lg border border w-[588px] max-sm:w-full mb-8">
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
                disabled={connecting}
                className="flex-1 gap-2 p-3 text-base leading-4 bg-gray-50 rounded-lg border border text-stone-900 hover:bg-gray-100 transition-colors"
              >
                {connecting ? (
                  <>
                    <svg className="inline-block animate-spin h-4 w-4 mr-2 text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  "Connect your wallet"
                )}
              </button>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};