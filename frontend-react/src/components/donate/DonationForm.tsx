"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import { InputField } from "./InputField";
import { TextareaField } from "./TextareaField";

export const DonationForm: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [amount, setAmount] = useState("");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charityTokens, setCharityTokens] = useState<number | null>(null); // New state for charity tokens

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function donate(string poolName, string message) public payable",
  ];

  const handleSubmit = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet to donate.");
      return;
    }

    if (!selectedPool || !amount) {
      alert("Please select a pool and enter an amount to donate.");
      return;
    }

    try {
      setLoading(true);

      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the donate function on the smart contract
      const tx = await contract.donate(selectedPool, message, {
        value: ethers.utils.parseEther(amount), // Convert ETH to Wei
      });
      await tx.wait();

      alert("Donation successful!");

      // Fetch charity tokens from the backend
      const response = await fetch(`/api/charity-tokens?wallet=${walletAddress}`);
      const data = await response.json();
      setCharityTokens(data.tokens); // Update charity tokens state
    } catch (error) {
      console.error("Failed to process donation:", error);
      alert("Donation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageChange = (value: string) => {
    // Limit the message to 500 characters
    if (value.length <= 500) {
      setMessage(value);
    }
  };

  const poolOptions = [
    { title: "Wildfire", color: "bg-orange-500" }, // Sunset orange
    { title: "Flood", color: "bg-blue-300" }, // Light baby blue
    { title: "Earthquake", color: "bg-tan-500" }, // Muted tan
  ];

  const selectedColor = poolOptions.find((pool) => pool.title === selectedPool)?.color || "bg-white";

  // AJ: a method here getting the highest donors
  const highestDonorsData = [
    { name: "0xA4...B21", amount: "5.0 ETH" },
    { name: "🌟 generous.eth", amount: "3.2 ETH" },
    { name: "donorhero.eth", amount: "2.8 ETH" },
    { name: "0xC3...D45", amount: "2.5 ETH" },
    { name: "kindheart.eth", amount: "2.0 ETH" },
    { name: "0xE5...F67", amount: "1.8 ETH" },
    { name: "charitychamp.eth", amount: "1.5 ETH" },
    { name: "0xG7...H89", amount: "1.2 ETH" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Donation Form Section */}
      <section className="flex-1 px-6 pt-6 pb-11 bg-white rounded-lg border border-solid border-zinc-300 max-md:px-5">
        <InputField
          label="Amount to Donate"
          placeholder="Enter amount in ETH"
          value={amount}
          onChange={setAmount}
        />

        <div className="mt-4">
          <div
            className={`relative border border-zinc-300 rounded-md shadow-sm ${selectedColor} text-black`}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-left"
            >
              <div className="text-sm font-medium">
                {selectedPool || "Select a Pool to Donate Toward"}
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 bg-white border border-zinc-300 rounded-md shadow-md z-10">
                {poolOptions.map((pool) => (
                  <button
                    key={pool.title}
                    onClick={() => {
                      setSelectedPool(pool.title);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100`}
                  >
                    {pool.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <TextareaField
            label="Message"
            value={message}
            onChange={handleMessageChange}
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/500 characters
          </p>
        </div>

        <div className="flex gap-4 items-center mt-4 leading-none whitespace-nowrap min-h-10 text-neutral-100">
          <button
            onClick={handleSubmit}
            className={`overflow-hidden flex-1 shrink gap-2 self-stretch p-3 my-auto w-full rounded-md border border-solid basis-0 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 hover:text-gray-200"
            }`}
            disabled={loading}
          >
            {loading ? "Processing..." : "Donate"}
          </button>
        </div>
      </section>

      {/* Overview Panel Section */}
      <section className="flex-1 self-start px-5 pt-6 pb-2.5 leading-snug bg-white rounded-lg border border-solid border-zinc-300 text-stone-900 max-md:pr-5">
        <h2 className="font-bold text-lg">Overview</h2>

        <div className="mt-4">
          <p className="font-medium">Wallet Address:</p>
          <p className="text-sm text-gray-700">{walletAddress || "Not connected"}</p>
        </div>

        <div className="mt-4">
          <p className="font-medium">Selected Pool:</p>
          <p className="text-sm text-gray-700">{selectedPool || "None"}</p>
        </div>

        <div className="mt-4">
          <p className="font-medium">Amount:</p>
          <p className="text-sm text-gray-700">{amount || "0 ETH"}</p>
        </div>

        <div className="mt-4">
          <p className="font-medium">Message:</p>
          <p className="text-sm text-gray-700">{message || "No message provided."}</p>
        </div>

        <div className="mt-4">
          <p className="font-medium">Rewarded Charity Tokens:</p>
          <p className="text-sm text-gray-700">
            {charityTokens !== null ? charityTokens : "Pending..."}
          </p>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="flex-1 px-5 pt-6 pb-2.5 leading-snug bg-white rounded-lg border border-solid border-zinc-300 text-stone-900 max-md:pr-5">
        <h2 className="font-bold text-lg text-center">Highest Historical Donors</h2>
        <ul className="mt-4 space-y-4">
          {highestDonorsData.map((entry, index) => (
            <li
              key={index}
              className="flex justify-between border-b pb-2 text-sm sm:text-base"
            >
              <span>{entry.name}</span>
              <span className="text-emerald-700 font-semibold">
                {entry.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};