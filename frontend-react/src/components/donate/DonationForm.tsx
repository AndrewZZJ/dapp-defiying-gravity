"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { InputField } from "./InputField";
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

export const DonationForm: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context
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

  // Popup state (visual only)
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

  type Donor = {
    address: string;
    amount: string;
  };

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
    const fetchAddressesAndDonors = async () => {
      try {
        const response = await fetch("/addresses.json");
        const deploymentConfig = await response.json();

        const wildfire = deploymentConfig["FireInsurance"];
        const flood = deploymentConfig["FloodInsurance"];
        const earthquake = deploymentConfig["EarthquakeInsurance"];

        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const contract = new ethers.Contract(wildfire, GraviInsuranceABI.abi, provider);
        const exchangeRate = await contract.getDonationRewardRate();
        setCharityTokens(exchangeRate.toString());

        const contract_flood = new ethers.Contract(flood, GraviInsuranceABI.abi, provider);
        const exchangeRate_flood = await contract_flood.getDonationRewardRate();
        setCharityTokensFlood(exchangeRate_flood.toString());

        const contract_earthquake = new ethers.Contract(earthquake, GraviInsuranceABI.abi, provider);
        const exchangeRate_earthquake = await contract_earthquake.getDonationRewardRate();
        setCharityTokensEarthquake(exchangeRate_earthquake.toString());

        setFireAddress(wildfire);
        setFloodAddress(flood);
        setEarthquakeAddress(earthquake);

        // Default to showing Wildfire leaderboard
        await fetchDonors(wildfire);
        
        // Set default selected pool to Wildfire
        setSelectedPool("Wildfire");
      } catch (err) {
        console.error("Failed to load addresses or donors:", err);
      }
    };

    if (walletAddress && window.ethereum) {
      fetchAddressesAndDonors();
    }
  }, [walletAddress]);

  // Add useEffect to update donors when selectedPool changes
  useEffect(() => {
    if (!selectedPool || !window.ethereum) return;
    
    let poolAddress = "";
    if (selectedPool === "Wildfire") {
      poolAddress = fireAddress;
    } else if (selectedPool === "Flood") {
      poolAddress = floodAddress;
    } else if (selectedPool === "Earthquake") {
      poolAddress = earthquakeAddress;
    }
    
    if (poolAddress) {
      fetchDonors(poolAddress);
    }
  }, [selectedPool, fireAddress, floodAddress, earthquakeAddress]);

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
      setPopupTitle("Wallet Not Connected");
      setPopupMsg("Please connect your wallet to donate.");
      setShowPopup(true);
      return;
    }

    if (!selectedPool || !amount) {
      setPopupTitle("Incomplete Donation Details");
      setPopupMsg("Please select a pool and enter an amount to donate.");
      setShowPopup(true);
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
        setPopupTitle("Invalid Pool Selected");
        setPopupMsg("Please choose a valid donation pool.");
        setShowPopup(true);
        return;
      }

      console.log("Selected Address:", selectedAddress);

      const contract = new ethers.Contract(selectedAddress, GraviInsuranceABI.abi, signer);

      // Call the donate function on the smart contract
      const tx = await contract.donate({
        value: ethers.utils.parseEther(amount),
      });


      await tx.wait();

      setPopupTitle("Donation Successful");
      setPopupMsg(`Donated ${amount} ETH to the insurance.\n Awarded charity tokens will be sent to your wallet.\n\n Thank you for your support!\nTransaction hash:\n${tx.hash}`);
      setShowPopup(true);

      setAmount("");

      // Refresh the donors list for the selected pool
      await fetchDonors(selectedAddress);

      // // Show the success popup
      // setShowPopup(true);
    } catch (error) {
      console.error("Failed to process donation:", error);
      setPopupTitle("Donation Failed");
      setPopupMsg((error as any)?.reason || (error as any)?.message || "Donation failed. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const poolOptions = [
    { title: "Wildfire", color: "bg-orange-100", iconColor: "text-orange-500", icon: "🔥" },
    { title: "Flood", color: "bg-blue-100", iconColor: "text-blue-500", icon: "💧" },
    { title: "Earthquake", color: "bg-amber-100", iconColor: "text-amber-500", icon: "🌋" },
  ];

  const selectedPoolOption = poolOptions.find((pool) => pool.title === selectedPool);
  const selectedColor = selectedPoolOption?.color || "bg-gray-50";
  const selectedIconColor = selectedPoolOption?.iconColor || "text-gray-400";
  const selectedIcon = selectedPoolOption?.icon || "🏦";

  const charityTokenMapping: Record<string, number | null> = {
    Wildfire: charityTokens,
    Flood: charityTokens_flood,
    Earthquake: charityTokens_earthquake,
  };

  

  return (
  <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
    <div className="max-w-7xl mx-auto">
        {walletAddress && (
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 mb-6">
            Donate to Insurance Pools
          </h1>
        )}
      
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
              <pre className="text-sm text-center break-all whitespace-pre-wrap">{popupMsg}</pre>
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

      {/* Conditional rendering based on wallet connection */}
      {walletAddress ? (
        // When wallet is connected, show the donation interface
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Make a Donation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Donate
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount in ETH"
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">ETH</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Insurance Pool
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        selectedPool ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      <div className="flex items-center">
                        {selectedPool && (
                          <span className={`w-3 h-3 rounded-full mr-2 ${
                            selectedPool === "Wildfire" ? "bg-orange-500" :
                            selectedPool === "Flood" ? "bg-blue-300" :
                            "bg-yellow-600"
                          }`}></span>
                        )}
                        <span>{selectedPool || "Select a Pool"}</span>
                      </div>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1">
                        {poolOptions.map((pool) => (
                          <button
                            key={pool.title}
                            onClick={() => {
                              setSelectedPool(pool.title);
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className={`w-3 h-3 rounded-full mr-2 ${
                              pool.title === "Wildfire" ? "bg-orange-500" :
                              pool.title === "Flood" ? "bg-blue-300" :
                              "bg-yellow-600"
                            }`}></span>
                            {pool.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50">
              <button
                onClick={handleSubmit}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Donate Now"
                )}
              </button>
            </div>
          </section>
  
          {/* Overview Panel Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Donation Overview</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Wallet Address</span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[170px]">
                      {walletAddress || "Not connected"}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Selected Pool</span>
                    <div className="flex items-center">
                      {selectedPool && (
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          selectedPool === "Wildfire" ? "bg-orange-500" :
                          selectedPool === "Flood" ? "bg-blue-300" :
                          "bg-yellow-600"
                        }`}></span>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {selectedPool || "None"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Donation Amount</span>
                    <span className="text-sm font-medium text-gray-900">
                      {amount !== "" ? `${amount} ETH` : "0 ETH"}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Rewarded Tokens</span>
                        <span className="text-sm font-medium text-gray-900">
                        {selectedPool && amount !== "" && !isNaN(parseFloat(amount)) && charityTokenMapping[selectedPool] !== null 
                            ? (parseFloat(amount) * Number(charityTokenMapping[selectedPool])).toFixed(2) + " tokens"
                            : "N/A"}
                        </span>
                    </div>
                    </div>
              </div>
            </div>
          </section>
  
          {/* Leaderboard Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden h-full min-h-[400px]">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
                {selectedPool ? `${selectedPool} Donor Leaderboard` : "Donor Leaderboard"}
              </h2>
              
              {donors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No donors yet</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden h-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {donors.map((entry, index) => (
                        <tr key={index} className={index < 3 ? "bg-blue-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  index === 0 ? "bg-yellow-400" : 
                                  index === 1 ? "bg-gray-400" : 
                                  "bg-amber-700"
                                }`}>
                                  {index + 1}
                                </div>
                              ) : (
                                <span className="text-gray-500">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900">
                              {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`text-sm font-medium ${
                              index < 3 ? "text-blue-600" : "text-gray-900"
                            }`}>
                              {parseFloat(entry.amount).toFixed(3)} ETH
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        // When wallet is not connected, show login card
        <div className="flex justify-center items-center pt-8">
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
    </div>
  </div>
);
};
