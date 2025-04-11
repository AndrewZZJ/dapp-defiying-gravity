"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

export const PoolsSection: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state and setter from context
  const [coverPeriod, setCoverPeriod] = useState(30); // Default cover period in days
  const [portfolioValue, setPortfolioValue] = useState(1); // Default portfolio value in ETH
  const [selectedDisaster, setSelectedDisaster] = useState("Wildfire"); // Default disaster type
  const [annualFee, setAnnualFee] = useState("?"); // Placeholder for annual fee
  const [coverCost, setCoverCost] = useState("N/A"); // Placeholder for cover cost
  const [maxCoverage, setMaxCoverage] = useState("N/A"); // Placeholder for max coverage
  const [homeAddress, setHomeAddress] = useState(""); // State for the user's home address
  const [isLoading, setIsLoading] = useState(false);
  const [insuranceAddress, setInsuranceAddress] = useState<string | null>(null);

  // Function to connect wallet
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

  useEffect(() => {
    const fetchInsuranceAddress = async () => {
      try {
        const response = await fetch("/addresses.json");
        const data = await response.json();

        let address = null;
        switch (selectedDisaster) {
          case "Wildfire":
            address = data["FireInsurance"];
            break;
          case "Flood":
            address = data["FloodInsurance"];
            break;
          case "Earthquake":
            address = data["EarthquakeInsurance"];
            break;
          default:
            address = null;
        }

        setInsuranceAddress(address);
      } catch (err) {
        console.error("Failed to load insurance address:", err);
      }
    };

    fetchInsuranceAddress();
  }, [selectedDisaster]);

  // Fetch data from the backend or smart contract (for things that are not triggered by user input)
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        if (!walletAddress) return;

        const fetchedAnnualFee = await fetchAnnualFee();
        setAnnualFee(fetchedAnnualFee || "?"); // Default to placeholder if no data
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
        setAnnualFee("?");
      }
    };

    fetchOverviewData();
  }, [walletAddress]);

  // Example function to fetch annual fee (replace with actual logic)
  const fetchAnnualFee = async (): Promise<string | null> => {
    try {
      // Simulate a backend call
      // return null; // Replace with actual logic

      const response = await fetch("/addresses.json");
      const addresses = await response.json();

      // Mapping disaster label to key in addresses.json
      const disasterKeyMap: Record<string, string> = {
        Wildfire: "FireInsurance",
        Flood: "FloodInsurance",
        Earthquake: "EarthquakeInsurance",
      };

      const insuranceAddress = addresses[disasterKeyMap[selectedDisaster]];

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(insuranceAddress, GraviInsuranceABI.abi, provider);

      const premiumRate = await contract.premiumRate();
      // const annualFeeInEth = ethers.utils.formatEther(premiumRate);
      setAnnualFee(`${premiumRate}%`);
      return `${premiumRate}%`;

    } catch (error) {
      console.error("Error fetching annual fee:", error);
      return null;
    }
  };

  const handlePurchase = async () => {
    if (!walletAddress) return alert("Connect your wallet first.");
    if (!homeAddress.trim()) return alert("Enter a property address.");

    try {
      setIsLoading(true);

      const response = await fetch("/addresses.json");
      const addresses = await response.json();

      // Mapping disaster label to key in addresses.json
      const disasterKeyMap: Record<string, string> = {
        Wildfire: "FireInsurance",
        Flood: "FloodInsurance",
        Earthquake: "EarthquakeInsurance",
      };

      const insuranceAddress = addresses[disasterKeyMap[selectedDisaster]];

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(insuranceAddress, GraviInsuranceABI.abi, signer);

      const startTime = Math.floor(Date.now() / 1000);
      const propertyValueInWei = ethers.utils.parseEther(portfolioValue.toString());

      // STEP 1: Calculate correct premium
      const premium = await contract.calculatePremium(homeAddress, propertyValueInWei, coverPeriod);

      // STEP 2: Send transaction with exactly that premium
      const tx = await contract.buyInsurance(
        startTime,
        coverPeriod,
        homeAddress,
        propertyValueInWei,
        {
          value: premium,
        }
      );

      await tx.wait();
      alert("Insurance purchased successfully!");


      // STEP 3: Update the UI and clear the Desired Address, Portfolio Value, and Cover Period fields
      setHomeAddress("");
      setPortfolioValue(1);
      setCoverPeriod(30);
      

      // Set Coverage cost and Max Coverage to "N/A" after purchase
      setCoverCost("N/A");
      setMaxCoverage("N/A");

    } catch (error) {
      console.error("Failed to purchase insurance:", error);
      alert("Purchase failed. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // A plain async function to calculate coverage cost without internal debounce logic
  const calculateCoverageCost = async () => {
    try {
      const response = await fetch("/addresses.json");
      const addresses = await response.json();

      // Mapping disaster label to key in addresses.json
      const disasterKeyMap: Record<string, string> = {
        Wildfire: "FireInsurance",
        Flood: "FloodInsurance",
        Earthquake: "EarthquakeInsurance",
      };

      // If necessary fields aren't set, mark as unavailable
      if (!homeAddress || !portfolioValue) {
        setCoverCost("N/A");
        // setAnnualFee("N/A");
        setMaxCoverage("N/A");
        return;
      }

      const insuranceAddress = addresses[disasterKeyMap[selectedDisaster]];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(insuranceAddress, GraviInsuranceABI.abi, signer);

      const propertyValueInWei = ethers.utils.parseEther(portfolioValue.toString());
      const premium = await contract.calculatePremium(homeAddress, propertyValueInWei, coverPeriod);

      // Set annual fee (premium converted to ETH)
      const premiumInEth = ethers.utils.formatEther(premium);
      setCoverCost(`${premiumInEth} ETH`);

      // Calculate the coverage amount from the premium
      const coverageAmount = await contract.calculateCoverageAmountFromPremium(premium);
      const coverageAmountInEth = ethers.utils.formatEther(coverageAmount);
      setMaxCoverage(`${coverageAmountInEth} ETH`);
    } catch (error) {
      console.error("Error calculating coverage cost:", error);
      setCoverCost("Error");
      // setAnnualFee("Error");
      setMaxCoverage("Error");
    }
  };

  useEffect(() => {
    // Immediately set the UI to indicate a calculation is pending
    setCoverCost("Calculating...");
    // setAnnualFee("Calculating...");
    setMaxCoverage("Calculating...");
  
    // If required fields are not set, clear the messages to "N/A"
    if (!homeAddress || !portfolioValue) {
      setCoverCost("N/A");
      // setAnnualFee("N/A");
      setMaxCoverage("N/A");
      return;
    }
  
    // Set a timer to call the calculation after 2 seconds
    const timer = setTimeout(() => {
      calculateCoverageCost();
    }, 2000);
  
    // Cleanup: clear the timer if any dependency changes within the delay period
    return () => clearTimeout(timer);
  }, [homeAddress, portfolioValue, coverPeriod, selectedDisaster]);

  const calculateCoverageDates = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + coverPeriod);

    const formatDate = (date: Date) =>
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <main className="relative px-8 py-12 bg-white min-h-screen">
      <h1 className="mb-12 text-4xl font-bold text-center text-gray-900">
        Buy Insurance
      </h1>

      {walletAddress ? (
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

            {/* Home Address Input */}
            <div className="mb-6 p-4 rounded-lg border border-gray-300">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Desired Address to Insure
              </label>
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => {
                  setHomeAddress(e.target.value);
                  // Do not call calculateCoverageCost here!
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your desired address to insure (123 Main St, City, Province/State, Country)."
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
                onChange={(e) => {
                  setPortfolioValue(Number(e.target.value));
                  // Do not call calculateCoverageCost here!
                }}
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
                onChange={(e) => {
                  setCoverPeriod(Number(e.target.value));
                  // Do not call calculateCoverageCost here!
                }}
                className="w-full accent-orange-500"
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
                onChange={(e) => {
                  setSelectedDisaster(e.target.value);
                }}
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

            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-700">Max Coverage</p>
              <p className="text-base text-gray-900">{maxCoverage}</p>
            </div>
          </section>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-lg font-medium">Please connect your wallet to proceed.</p>
          <button
            onClick={connectWallet}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </main>
  );
};