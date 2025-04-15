import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";
import { NavigationPill } from "./NavigationPill";


export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const { walletAddress, setWalletAddress } = useWallet();

  /* ------------------------------ balances --------------------------------- */
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [govBalance, setGovBalance] = useState<number | null>(null);
  const [chaBalance, setChaBalance] = useState<number | null>(null);

  /* ---------------------------- wallet connect ----------------------------- */
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setEthBalance(null);
    setGovBalance(null);
    setChaBalance(null);
  };

  /* -------------------------- fetch token balances ------------------------- */
  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress || typeof window.ethereum === "undefined") return;
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const ethWei = await provider.getBalance(walletAddress);
        setEthBalance(parseFloat(ethers.utils.formatEther(ethWei)).toFixed(3));

        const res = await fetch("/addresses.json");
        if (!res.ok) throw new Error("addresses.json fetch failed");
        const cfg = await res.json();

        const gov = new ethers.Contract(cfg["GraviGov"], GraviGovABI.abi, provider);
        const cha = new ethers.Contract(cfg["GraviCha"], GraviChaABI.abi, provider);
        const [govRaw, chaRaw] = await Promise.all([
          gov.balanceOf(walletAddress),
          cha.balanceOf(walletAddress),
        ]);
        setGovBalance(parseFloat(ethers.utils.formatEther(govRaw)));
        setChaBalance(parseFloat(ethers.utils.formatEther(chaRaw)));
      } catch (e) {
        console.error("Failed to fetch balances", e);
      }
    };
    fetchBalances();
  }, [walletAddress]);

  /* -------------------------------- render -------------------------------- */
  return (
    <header className="flex items-center justify-between p-8 w-full bg-white border-b border-zinc-300">
      {/* Logo */}
      <Link to="/" className="w-10 h-10 flex items-center">
        <img
          src="/img/Logo.png"
          alt="Logo"
          className="object-contain w-full h-full"
        />
      </Link>
      {/* <Link to="/" className="w-10 h-10 flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Logo"
          className="object-contain w-full h-full"
        />
      </Link> */}

      {/* NAV links */}
      <nav className="flex gap-4 text-base leading-none text-stone-900 ml-auto">
        <NavigationPill to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavigationPill>
        <NavigationPill to="/claims-covered" active={location.pathname === "/claims-covered"}>Claims</NavigationPill>
        <NavigationPill to="/buy-insurance" active={location.pathname === "/buy-insurance"}>Buy Insurance</NavigationPill>
        <NavigationPill to="/view-insurance" active={location.pathname === "/view-insurance"}>View Insurance</NavigationPill>
        <NavigationPill to="/donate" active={location.pathname === "/donate"}>Donate</NavigationPill>
        <NavigationPill to="/marketplace" active={location.pathname === "/marketplace"}>Auction</NavigationPill>
        <NavigationPill to="/exchange" active={location.pathname === "/exchange"}>Exchange</NavigationPill>
        <NavigationPill to="/governance/current" active={location.pathname.startsWith("/governance")}>Governance</NavigationPill>
      </nav>

      {/* Wallet section */}
      <div className="ml-4">
        {walletAddress ? (
          <div className="leading-tight text-right">
            <p className="text-sm text-gray-600 flex items-center gap-2 justify-end">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              <button
                onClick={handleLogout}
                className="px-2 py-1 bg-black text-white rounded hover:bg-gray-800 text-[10px]"
              >
                Logout
              </button>
            </p>
            <div className="flex gap-1 justify-end text-[10px] text-gray-500 mt-0.5">
              {/* {ethBalance && <Token label="ETH" value={ethBalance} />}
              {govBalance !== null && <Token label="GGov" value={govBalance.toFixed(1)} />}
              {chaBalance !== null && <Token label="GCha" value={chaBalance.toFixed(1)} />} */}
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
interface TokenProps { label: string; value: string | number; }
const Token: React.FC<TokenProps> = ({ label, value }) => (
  <span className="px-1 py-0.5 border border-gray-400 rounded-full bg-white whitespace-nowrap">
    {label}:{value}
  </span>
);
