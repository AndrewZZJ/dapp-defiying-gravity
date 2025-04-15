"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

const useMockData = true; // toggle as needed
//NEED TO ADD AN ADD MODERATOR FUNCTION IN SMART CONTRACT GRAVIINSURANCE

const mockModerators = [
  { address: "0x1234...abcd", votes: 12 },
  { address: "0x5678...efgh", votes: 8 },
  { address: "0x9abc...ijkl", votes: 5 },
];

export const ModeratorNominations: React.FC = () => {
  const { walletAddress } = useWallet();
  const [nomineeInput, setNomineeInput] = useState<string>("");
  const [moderators, setModerators] = useState(mockModerators);
  const [votedFor, setVotedFor] = useState<Set<string>>(new Set());
  const [insuranceAddresses, setInsuranceAddresses] = useState<string[]>([]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await fetch("/addresses.json");
        const data = await res.json();
        setInsuranceAddresses([
          data["FireInsurance"],
          data["FloodInsurance"],
          data["EarthquakeInsurance"],
        ]);
      } catch (err) {
        console.error("Failed to load insurance contract addresses", err);
      }
    };

    if (walletAddress) {
      loadAddresses();
    }
  }, [walletAddress]);

  const handleNominate = async () => {
    if (!nomineeInput.trim()) return alert("Enter a valid wallet address.");
    if (useMockData) {
      alert(`(Mock) Nominated ${nomineeInput}`);
      setNomineeInput("");
      return;
    }
  
    try {
      const response = await fetch("/addresses.json");
      const { FireInsurance, FloodInsurance, EarthquakeInsurance } = await response.json();
      const insuranceAddresses = [FireInsurance, FloodInsurance, EarthquakeInsurance];
  
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
  
      const maxAmount = ethers.utils.parseEther("100"); // 💰 set approval limit here
  
      for (const addr of insuranceAddresses) {
        const contract = new ethers.Contract(addr, GraviInsuranceABI.abi, signer);
        const tx = await contract.addModeratorToPool(nomineeInput, maxAmount);
        await tx.wait();
      }
  
      alert(`Successfully nominated ${nomineeInput} as moderator on all pools.`);
      setNomineeInput("");
    } catch (err) {
      console.error("Nomination failed:", err);
      alert("Nomination failed. See console for details.");
    }
  };
  
  const handleVote = (address: string) => {
    if (votedFor.has(address)) return;

    alert(`(Mock) Voted for moderator ${address}`);
    setModerators((prev) =>
      prev.map((mod) =>
        mod.address === address ? { ...mod, votes: mod.votes + 1 } : mod
      )
    );
    setVotedFor((prev) => new Set(prev).add(address));
  };

  // Only render the component content if wallet is connected
  if (!walletAddress) {
    return null; // Don't render anything when wallet is not connected
  }

  return (
    <section className="bg-white p-8 rounded-lg shadow mx-auto max-w-screen-sm my-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Nominate Moderators
      </h2>

      {/* Nomination input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 items-center justify-center">
        <input
          type="text"
          value={nomineeInput}
          onChange={(e) => setNomineeInput(e.target.value)}
          placeholder="Enter wallet address"
          className="p-2 border border-gray-300 rounded w-72"
        />
        <button
          onClick={handleNominate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Nomination
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700 text-center">
        Current Nominations
      </h3>

      <ul className="flex flex-col gap-4">
        {moderators.map((mod) => {
          const hasVoted = votedFor.has(mod.address);
          return (
            <li
              key={mod.address}
              className="flex items-center justify-between border p-4 rounded-md shadow-sm"
            >
              <div className="text-gray-800 font-mono">{mod.address}</div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{mod.votes} votes</span>
                <button
                  onClick={() => handleVote(mod.address)}
                  disabled={hasVoted}
                  className={`px-3 py-1 text-sm rounded text-white ${
                    hasVoted
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {hasVoted ? "Voted" : "Vote"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};