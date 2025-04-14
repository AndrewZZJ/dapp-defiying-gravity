"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import { InputField } from "./InputField";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

export const DonationForm: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [amount, setAmount] = useState("");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charityTokens, setCharityTokens] = useState<number | null>(null); 
  const [charityTokens_flood, setCharityTokensFlood] = useState<number | null>(null); 
  const [charityTokens_earthquake, setCharityTokensEarthquake] = useState<number | null>(null); 
  const [fireAddress, setFireAddress] = useState("");
  const [floodAddress, setFloodAddress] = useState("");
  const [earthquakeAddress, setEarthquakeAddress] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  type Donor = {
    address: string;
    amount: string;
  };

  useEffect(() => {
    const fetchAddressesAndDonors = async () => {
      try {
        const response = await fetch("/addresses.json");
        const deploymentConfig = await response.json();
  
        const wildfire = deploymentConfig["FireInsurance"];
        const flood = deploymentConfig["FloodInsurance"];
        const earthquake = deploymentConfig["EarthquakeInsurance"];

        // Fetch charity tokens from the backend (Note this should be PER insurance)
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const contract = new ethers.Contract(wildfire, GraviInsuranceABI.abi, provider);
        const exchangeRate = await contract.getDonationRewardRate();
        setCharityTokens(exchangeRate.toString());

        const contract_flood = new ethers.Contract(flood, GraviInsuranceABI.abi, provider);
        const exchangeRate_flood = await contract_flood.getDonationRewardRate();
        setCharityTokensFlood(exchangeRate_flood.toString());

        const contract_earthquake = new ethers.Contract(wildfire, GraviInsuranceABI.abi, provider);
        const exchangeRate_earthquake = await contract_earthquake.getDonationRewardRate();
        setCharityTokensEarthquake(exchangeRate_earthquake.toString());

        setFireAddress(wildfire);
        setFloodAddress(flood);
        setEarthquakeAddress(earthquake);
  
        // Default to showing Wildfire leaderboard
        await fetchDonors(wildfire);
      } catch (err) {
        console.error("Failed to load addresses or donors:", err);
      }
    };
  
    fetchAddressesAndDonors();
  }, []);


  // const contractABI = [
  //   "function donate() public payable",
  // ];  

  const fetchDonors = async (poolAddress: string) => {
    if (!poolAddress || !window.ethereum) return;
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(poolAddress, GraviInsuranceABI.abi, provider);
      const [addresses, amounts]: [string[], ethers.BigNumber[]] = await contract.getAllDonors();
  
      const formatted: Donor[] = addresses.map((addr, i) => ({
        address: addr,
        amount: ethers.utils.formatEther(amounts[i]),
      }));
  
      // Sort by donation amount (descending), then keep only top 8
      const topDonors = formatted
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 8);
  
      setDonors(topDonors);
    } catch (err) {
      console.error("Failed to fetch donors:", err);
    }
  };
  

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
    let selectedAddress = "";

    if (selectedPool === "Wildfire") {
      selectedAddress = fireAddress;
    } else if (selectedPool === "Flood") {
      selectedAddress = floodAddress;
    } else if (selectedPool === "Earthquake") {
      selectedAddress = earthquakeAddress;
    } else {
      alert("Invalid pool selected.");
      return;
    }

    console.log("Selected Address:", selectedAddress);

    const contract = new ethers.Contract(selectedAddress, GraviInsuranceABI.abi, signer);

    // Call the donate function on the smart contract
    const tx = await contract.donate({
      value: ethers.utils.parseEther(amount),
    });

    await tx.wait();

    alert("Donation successful!");

    // Clear the donation amount
    setAmount("");

    // Refresh the donors list for the selected pool
    await fetchDonors(selectedAddress);
  } catch (error) {
    console.error("Failed to process donation:", error);
    alert("Donation failed. Please try again.");
  } finally {
    setLoading(false);
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

  const charityTokenMapping: Record <string, number | null> = {
    "Wildfire": charityTokens,
    "Flood": charityTokens_flood,
    "Earthquake": charityTokens_earthquake,
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Donation Form Section */}
      <section className="flex-1 px-4 pt-4 pb-1 bg-white rounded-lg border border-solid border-zinc-300 max-md:px-4">
        <InputField
          label="Amount to Donate"
          placeholder="Enter amount in ETH"
          value={amount}
          onChange={setAmount}
        />

        <div className="mt-3">
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

        <div className="flex gap-4 items-center mt-3 leading-none whitespace-nowrap text-neutral-100">
          <button
            onClick={handleSubmit}
            className={`overflow-hidden flex-1 shrink gap-2 self-stretch p-3 w-full rounded-md border border-solid ${
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
          <p className="font-medium">Donation Amount:</p>
          <p className="text-sm text-gray-700">{amount !== "" ? amount + " ETH" : "0 ETH"}</p>
        </div>

        <div className="mt-4">
          <p className="font-medium">Rewarded Charity Tokens (Per ETH):</p>
          <p className="text-sm text-gray-700">
            {selectedPool ? charityTokenMapping[selectedPool] ?? "Pending request..." : "Select a pool first"}
          </p>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="flex-1 px-5 pt-6 pb-2.5 leading-snug bg-white rounded-lg border border-solid border-zinc-300 text-stone-900 max-md:pr-5">
        <h2 className="font-bold text-lg text-center">Highest Historical Donors</h2>
        <ul className="mt-4 space-y-4">
          {donors.length === 0 ? (
            <li className="text-center text-gray-500 italic">No donors yet</li>
          ) : (
            donors.map((entry, index) => (
              <li
                key={index}
                className="flex justify-between border-b pb-2 text-sm sm:text-base"
              >
                <span>
                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </span>
                <span className="text-emerald-700 font-semibold">
                  {parseFloat(entry.amount).toFixed(3)} ETH
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};