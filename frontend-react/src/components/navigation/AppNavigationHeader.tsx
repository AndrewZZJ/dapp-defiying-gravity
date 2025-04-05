import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import { NavigationPill } from "./NavigationPill";

export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context

  // Close the dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setGovernanceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as ethers.providers.ExternalProvider
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address); // Update global wallet state
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  return (
    <header className="flex items-center justify-between p-8 w-full bg-white border-b border-zinc-300">
      {/* Logo now acts as a Home button */}
      <Link to="/" className="w-10 h-10 flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Logo"
          className="object-contain w-full h-full"
        />
      </Link>

      <div className="flex gap-4 items-center ml-auto">
        <nav className="flex gap-4 text-base leading-none text-stone-900">
          <NavigationPill to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavigationPill>
          <NavigationPill to="/claims-covered" active={location.pathname === "/claims-covered"}>Claims</NavigationPill>
          <NavigationPill to="/buy-insurance" active={location.pathname === "/buy-insurance"}>Buy Insurance</NavigationPill>
          <NavigationPill to="/view-insurance" active={location.pathname === "/view-insurance"}>View Insurance</NavigationPill>
          <NavigationPill to="/donate" active={location.pathname === "/donate"}>Donate</NavigationPill>
          <NavigationPill to="/marketplace" active={location.pathname === "/marketplace"}>Marketplace</NavigationPill>
          <NavigationPill to="/exchange" active={location.pathname === "/exchange"}>Exchange</NavigationPill>


          {/* Governance Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setGovernanceOpen(prev => !prev)}
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                location.pathname.startsWith("/governance")
                  ? "bg-zinc-200 text-black"
                  : "text-stone-900"
              }`}
            >
              Governance
            </button>
            {governanceOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-300 rounded-md shadow-md z-50"
              style={{ left: "50%", transform: "translateX(-50%)" }}>         
                <Link
                  to="/governance/current"
                  className="block px-4 py-2 hover:bg-zinc-100 text-stone-900"
                  onClick={() => setGovernanceOpen(false)}
                >
                  Current Proposals
                </Link>
                <Link
                  to="/governance/submit"
                  className="block px-4 py-2 hover:bg-zinc-100 text-stone-900"
                  onClick={() => setGovernanceOpen(false)}
                >
                  Submit a Proposal
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Wallet Connection */}
        <div className="ml-4">
          {walletAddress ? (
            <p className="text-sm text-gray-600">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};