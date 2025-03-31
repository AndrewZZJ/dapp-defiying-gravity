"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

export const PoolsSection: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [coverPeriod, setCoverPeriod] = useState(30); // Default cover period in days
  const [portfolioValue, setPortfolioValue] = useState(1); // Default portfolio value in ETH
  const [selectedDisaster, setSelectedDisaster] = useState("Wildfire"); // Default disaster type
  const [annualFee, setAnnualFee] = useState("0.54%"); // Placeholder for annual fee
  const [coverCost, setCoverCost] = useState("0.0004 ETH"); // Placeholder for cover cost
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from the backend or smart contract
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        if (!walletAddress) return;

        // Example: Fetch annual fee from the backend or smart contract
        const fetchedAnnualFee = await fetchAnnualFee();
        setAnnualFee(fetchedAnnualFee || "0.54%"); // Default to placeholder if no data

        // Example: Fetch cover cost from the backend or smart contract
        const fetchedCoverCost = await fetchCoverCost();
        setCoverCost(fetchedCoverCost || "0.0004 ETH"); // Default to placeholder if no data
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
        // Use placeholders if fetching fails
        setAnnualFee("0.54%");
        setCoverCost("0.0004 ETH");
      }
    };

    fetchOverviewData();
  }, [walletAddress]);

  // Example function to fetch annual fee (replace with actual backend/smart contract call)
  const fetchAnnualFee = async (): Promise<string | null> => {
    try {
      // Simulate a backend call
      return null; // Replace with actual logic
    } catch (error) {
      console.error("Error fetching annual fee:", error);
      return null;
    }
  };

  // Example function to fetch cover cost (replace with actual backend/smart contract call)
  const fetchCoverCost = async (): Promise<string | null> => {
    try {
      // Simulate a backend call
      return null; // Replace with actual logic
    } catch (error) {
      console.error("Error fetching cover cost:", error);
      return null;
    }
  };

  const handlePurchase = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setIsLoading(true);

      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contractAddress = "0xYourContractAddress"; // Replace with your contract address
      const contractABI = [
        "function buyInsurance(uint256 coverPeriod) public payable",
      ];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the buyInsurance function on the smart contract
      const tx = await contract.buyInsurance(coverPeriod, {
        value: ethers.utils.parseEther(portfolioValue.toString()), // Convert ETH to Wei
      });
      await tx.wait();

      alert("Insurance purchased successfully!");
    } catch (error) {
      console.error("Failed to purchase insurance:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCoverageDates = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + coverPeriod);

    const formatDate = (date: Date) =>
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (!walletAddress) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-medium text-gray-700">
          Please connect your wallet to access this page.
        </p>
      </main>
    );
  }

  return (
    <main className="relative px-8 py-12 bg-white min-h-screen">
      <h1 className="mb-12 text-4xl font-bold text-center text-gray-900">
        Buy Insurance
      </h1>

      <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto">
        {/* Details Pane */}
        <section className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-300">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Details</h2>

          {/* Connected Wallet Address */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Connected Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>

          {/* Portfolio Value */}
          <div className="mb-6 p-4 rounded-lg border border-gray-300">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Portfolio Value (ETH)
            </label>
            <input
              type="number"
              value={portfolioValue}
              onChange={(e) => setPortfolioValue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              min="0.1"
              step="0.1"
            />
          </div>

          {/* Cover Period */}
          <div className="mb-6 p-4 rounded-lg border border-gray-300">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Cover Period (Days)
            </label>
            <input
              type="range"
              min="28"
              max="365"
              value={coverPeriod}
              onChange={(e) => setCoverPeriod(Number(e.target.value))}
              className="w-full accent-orange-500" // Sunset orange slider
            />
            <p className="text-sm text-gray-600 mt-2">
              {coverPeriod} days (28 days - 365 days)
            </p>
          </div>

          {/* Disaster Type Dropdown */}
          <div className="mb-6 p-4 rounded-lg border border-gray-300">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Disaster Type
            </label>
            <select
              value={selectedDisaster}
              onChange={(e) => setSelectedDisaster(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="Wildfire">Wildfire</option>
              <option value="Flood">Flood</option>
              <option value="Earthquake">Earthquake</option>
            </select>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            className={`w-full py-3 text-white font-medium rounded-md ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Purchase Insurance"}
          </button>
        </section>

        {/* Overview Pane */}
        <section className="w-1/3 bg-white p-6 rounded-lg shadow-md border border-gray-300 self-start">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Overview</h2>

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">Listing</p>
            <p className="text-base text-gray-900">{selectedDisaster} Cover</p>
          </div>

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">Portfolio Value</p>
            <p className="text-base text-gray-900">{portfolioValue} ETH</p>
          </div>

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">Cover Period</p>
            <p className="text-base text-gray-900">{calculateCoverageDates()}</p>
          </div>

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">Annual Fee</p>
            <p className="text-base text-gray-900">{annualFee}</p>
          </div>

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">Cover Cost</p>
            <p className="text-base text-gray-900">{coverCost}</p>
          </div>
        </section>
      </div>
    </main>
  );
};