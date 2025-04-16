"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
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

// Insurance type icons
const InsuranceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Wildfire':
      return <span className="text-lg">🔥</span>;
    case 'Flood':
      return <span className="text-lg">💧</span>;
    case 'Earthquake':
      return <span className="text-lg">🌋</span>;
    default:
      return <span className="text-lg">🏦</span>;
  }
};

interface InsuranceEntry {
  address: string;
  insurances: {
    type: string;
    id: string;
    contractAddress?: string;
    policyHolder?: string;
    maxCoverage?: string;
    premium?: string;
    startTime?: string;
    coverageEndDate?: string;
    isClaimed?: boolean;
    propertyAddress?: string;
    propertyValue?: string;
  }[];
}

export const ViewInsurance: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet();
  const [insuranceData, setInsuranceData] = useState<InsuranceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contractAddresses, setContractAddresses] = useState<{ [key: string]: string }>({});

  // Toggle this line to use template data or backend/smart contract data
  const useTemplateData = false;

  // Connect wallet if not already connected
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as ethers.providers.ExternalProvider
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  // Fetch insurance data when walletAddress changes (for the initial fetch)
  useEffect(() => {
    // Only refresh if we have both the wallet address and contract addresses
    if (walletAddress && Object.keys(contractAddresses).length > 0) {
      refreshInsuranceData();
    }
  }, [walletAddress, useTemplateData, contractAddresses]);

  // Load contract addresses from addresses.json
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/addresses.json");
        const data = await res.json();
        setContractAddresses(data);
      } catch (err) {
        console.error("Failed to load addresses.json:", err);
      }
    };
    fetchAddresses();
  }, []);

  // Function to fetch insurance data
  const refreshInsuranceData = async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const fetchedData = useTemplateData
        ? getTemplateInsuranceData()
        : await getInsuranceData(walletAddress);
      setInsuranceData(fetchedData);
    } catch (error) {
      console.error("Failed to refresh insurance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch insurance data when walletAddress changes (for the initial fetch)
  useEffect(() => {
    refreshInsuranceData();
  }, [walletAddress, useTemplateData]);

  // Function to fetch and group insurance policies by property address.
  const getInsuranceData = async (wallet: string): Promise<InsuranceEntry[]> => {
    try {
      if (!window.ethereum) throw new Error("No Ethereum provider found");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Define the types of insurance contracts.
      const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
      // Object to group policies by property address.
      const groupedInsurances: { [propertyAddress: string]: any[] } = {};

      // Loop over each insurance type and fetch policies.
      for (let type of types) {
        const insuranceAddress = contractAddresses[type];
        if (!insuranceAddress) continue;

        // Get a more human readable type name.
        if (type === "FireInsurance") type = "Wildfire";
        else if (type === "FloodInsurance") type = "Flood";
        else if (type === "EarthquakeInsurance") type = "Earthquake";
        else type = type.replace("Insurance", "");

        const contract = new ethers.Contract(insuranceAddress, GraviInsuranceABI.abi, signer);
        let policyIds: string[];
        try {
          policyIds = await contract.fetchInsuranceIds(wallet);
          console.log(`${type} Policy IDs:`, policyIds);
        } catch (err) {
          console.warn(`Skipping ${type} due to error:`, err);
          continue;
        }
        if (!policyIds.length) continue;

        // Retrieve full details for each policy.
        const insurances = await Promise.all(
          policyIds.map(async (id: string) => {
            const policyDetail = await contract.getUserPolicy(id);
            console.log(`${type} Policy Detail for ${id}:`, policyDetail);
            return {
              type,
              id,
              contractAddress: insuranceAddress,
              policyHolder: policyDetail._policyHolder,
              maxCoverage: ethers.utils.formatEther(policyDetail._maxCoverageAmount) + " ETH",
              premium: ethers.utils.formatEther(policyDetail._premiumPaid) + " ETH",
              startTime: new Date(policyDetail._startTime.toNumber() * 1000).toISOString(),
              coverageEndDate: new Date(policyDetail._endTime.toNumber() * 1000).toISOString(),
              isClaimed: policyDetail._isClaimed,
              propertyAddress: policyDetail._propertyAddress,
              propertyValue: ethers.utils.formatEther(policyDetail._propertyValue) + " ETH",
            };
          })
        );

        // Group policies by their property address.
        insurances.forEach((insurance) => {
          const propertyAddress = insurance.propertyAddress;
          if (groupedInsurances[propertyAddress]) {
            groupedInsurances[propertyAddress].push(insurance);
          } else {
            groupedInsurances[propertyAddress] = [insurance];
          }
        });
      }

      // Convert grouped object into an array of InsuranceEntry.
      return Object.keys(groupedInsurances).map((propertyAddress) => ({
        address: propertyAddress,
        insurances: groupedInsurances[propertyAddress],
      }));
    } catch (err) {
      console.error("getInsuranceData error:", err);
      return [];
    }
  };

  // Template data for development purposes
  const getTemplateInsuranceData = (): InsuranceEntry[] => {
    return [
      {
        address: "123 Main St, City, State, Country",
        insurances: [
          { type: "Wildfire", id: "0xabc123", maxCoverage: "100 ETH", coverageEndDate: "2025-12-31" },
          { type: "Flood", id: "0xdef456", maxCoverage: "50 ETH", coverageEndDate: "2024-06-30" },
        ],
      },
      {
        address: "456 Business Ave, City, State, Country",
        insurances: [
          { type: "Earthquake", id: "0xghi789", maxCoverage: "75 ETH", coverageEndDate: "2025-05-15" },
        ],
      },
    ];
  };
  
  // Function to get background color based on insurance type
  const getInsuranceTypeColor = (type: string): string => {
    switch (type) {
      case 'Wildfire':
        return 'bg-red-50 border-red-200';
      case 'Flood':
        return 'bg-blue-50 border-blue-200';
      case 'Earthquake':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Function to format date to be more readable
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <NavigationHeader />
      {/* <main className="relative px-4 py-12 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen"> */}
      {/* <main className="relative px-8 py-12 bg-gradient-to-b min-h-screen from-gray-50 to-gray-100 "> */}
      <main className="relative px-8 py-12 bg-white min-h-screen">
          <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
            Your Insurance Portfolio
          </h1>

        <div className="max-w-7xl mx-auto">
          {/* {walletAddress && (
            <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
              Your Insurance Portfolio
            </h1>
          )} */}

          {walletAddress ? (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-gray-700">Loading your insurance policies...</p>
                  </div>
                </div>
              ) : insuranceData.length > 0 ? (
                <div className="space-y-8">
                  {insuranceData.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                          <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Property Location
                        </h2>
                        <p className="text-xl text-gray-700 my-4">{entry.address}</p>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Active Policies</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {entry.insurances.map((insurance, idx) => {
                            const typeColor = getInsuranceTypeColor(insurance.type);
                            return (
                              <div
                                key={idx}
                                className={`rounded-lg border ${typeColor} p-5 transition-all hover:shadow-md`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <div className={`p-2 rounded-full ${
                                      insurance.type === 'Wildfire' ? 'bg-red-100' :
                                      insurance.type === 'Flood' ? 'bg-blue-100' :
                                      'bg-gray-100'
                                    } mr-3`}>
                                      <InsuranceIcon type={insurance.type} />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800">
                                      {insurance.type}
                                    </h4>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    insurance.isClaimed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {insurance.isClaimed ? 'Claimed' : 'Active'}
                                  </span>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                  <span className="text-sm text-gray-500 block mb-1">Policy ID</span>
                                  <div className="bg-gray-50 rounded p-2 overflow-hidden flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-800 font-mono break-all">
                                    {insurance.id}
                                    </span>
                                    <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(insurance.id);
                                      // Optional: Add toast notification or visual feedback
                                    }}
                                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                    title="Copy to clipboard"
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    </button>
                                  </div>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Coverage</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {insurance.maxCoverage}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Premium Paid</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {insurance.premium || "N/A"}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Start Date</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {formatDate(insurance.startTime)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">End Date</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {formatDate(insurance.coverageEndDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-500 mb-4">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Insurance Policies Found</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You currently don't have any insurance policies associated with this wallet address. 
                    Consider protecting your assets by purchasing an insurance policy.
                  </p>
                </div>
              )}
            </>
          ) : (
            // Wallet connection UI
            <div className="flex justify-center items-center pt-8">
              <article className="flex gap-6 items-start p-6 bg-white rounded-lg border border-gray-200 shadow-md w-[588px] max-sm:w-full">
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
                      className="flex-1 gap-2 p-3 text-base leading-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg border border-gray-200 text-stone-900"
                    >
                      Connect your wallet
                    </button>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
