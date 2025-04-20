"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

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

  // Popup state (visual only)
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const disasterOptions = [
    { title: "Wildfire", color: "bg-orange-500", iconColor: "text-orange-500", icon: "🔥" },
    { title: "Flood", color: "bg-blue-300", iconColor: "text-blue-500", icon: "💧" },
    { title: "Earthquake", color: "bg-yellow-600", iconColor: "text-amber-500", icon: "🌋" },
  ];  
  
  // Function to connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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

  const fetchAnnualFee = async (): Promise<string | null> => {
    try {
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

      // Get the premium rate which represents annual fee percentage
      const premiumRate = await contract.premiumRate();
      setAnnualFee(`${premiumRate}%`);
      return `${premiumRate}%`;
    } catch (error) {
      console.error("Error fetching annual fee:", error);
      return null;
    }
  };

  const handlePurchase = async () => {
  if (!walletAddress) return alert("Connect your wallet first.");
  if (!homeAddress.trim()) {
      setPopupTitle("Invalid Address");
      setPopupMsg("Please enter a valid address.");
      setShowPopup(true);
      return;
    }

  try {
    setIsLoading(true);

    const response = await fetch("/addresses.json");
    const addresses = await response.json();

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

    const premium = await contract.calculatePremium(homeAddress, propertyValueInWei, coverPeriod);

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

      // Show success popup
      setPopupTitle("Insurance Purchased Successfully");
      setPopupMsg(`Your policy purchase was successful! Transaction hash:\n${tx.hash}`);
      setShowPopup(true);

      // STEP 3: Update the UI and clear fields
      setHomeAddress("");
      setPortfolioValue(1);
      setCoverPeriod(30);

      // Reset coverage cost and max coverage
      setCoverCost("N/A");
      setMaxCoverage("N/A");
    } catch (error) {
      console.error("Failed to purchase insurance:", error);

      setPopupTitle("Purchase Failed");
      setPopupMsg(
        (error as any)?.reason ||
          (error as any)?.message ||
          "Transaction reverted — see console for details."
      );
      setShowPopup(true);
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
        setMaxCoverage("N/A");
        return;
      }

      const insuranceAddress = addresses[disasterKeyMap[selectedDisaster]];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(insuranceAddress, GraviInsuranceABI.abi, signer);

      const propertyValueInWei = ethers.utils.parseEther(portfolioValue.toString());
      
      // Calculate premium using the contract function
      const premium = await contract.calculatePremium(homeAddress, propertyValueInWei, coverPeriod);

      // Set premium cost as ETH
      const premiumInEth = ethers.utils.formatEther(premium);
      setCoverCost(`${premiumInEth} ETH`);

      // Calculate the coverage amount directly using the contract's function
      const coverageAmount = await contract.calculateCoverageAmount(
        homeAddress, 
        propertyValueInWei, 
        coverPeriod
      );
      
      const coverageAmountInEth = ethers.utils.formatEther(coverageAmount);
      setMaxCoverage(`${coverageAmountInEth} ETH`);
    } catch (error) {
      console.error("Error calculating coverage cost:", error);
      setCoverCost("Error");
      setMaxCoverage("Error");
    }
  };

  useEffect(() => {
    // Immediately set the UI to indicate a calculation is pending
    setCoverCost("Calculating...");
    setMaxCoverage("Calculating...");

    // If required fields are not set, clear the messages to "N/A"
    if (!homeAddress || !portfolioValue) {
      setCoverCost("N/A");
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
      <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
        Buy Insurance
      </h1>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-3xl font-bold text-center">{popupTitle}</p>
              <pre className="text-sm text-center break-all whitespace-pre-wrap">
                {popupMsg}
              </pre>
              <button
                onClick={() => setShowPopup(false)}
                className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}



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
            <div className="relative">
                <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    selectedDisaster ? "text-gray-900" : "text-gray-500"
                }`}
                >
                <div className="flex items-center">
                    {selectedDisaster && (
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                        selectedDisaster === "Wildfire" ? "bg-orange-500" :
                        selectedDisaster === "Flood" ? "bg-blue-300" :
                        "bg-yellow-600"
                    }`}></span>
                    )}
                    <span>{selectedDisaster || "Select a Disaster Type"}</span>
                </div>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
                </button>
                
                {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1">
                    {disasterOptions.map((option) => (
                    <button
                        key={option.title}
                        onClick={() => {
                        setSelectedDisaster(option.title);
                        setIsDropdownOpen(false);
                        fetchAnnualFee();
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                        option.title === "Wildfire" ? "bg-orange-500" :
                        option.title === "Flood" ? "bg-blue-300" :
                        option.title === "Earthquake" ? "bg-yellow-600" : ""
                        }`}></span>
                        {option.title}
                    </button>
                    ))}
                </div>
                )}
            </div>
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
        <div className="flex justify-center items-center">
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
        </div>
      )}
    </main>
  );
};
