"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

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

  // Fetch insurance data when walletAddress changes
  useEffect(() => {
    refreshInsuranceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, useTemplateData]);

  // Revised function to fetch and group insurance policies by property address.
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

        // Now get a more human readable type name.
        // For now hardcode the type name for Wildfire, Flood, and Earthquake.
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

  return (
    <>
      <NavigationHeader />
      <main className="relative px-8 py-12 bg-white min-h-screen">
        <h1 className="mb-8 text-4xl font-bold text-center text-gray-900">View Insurance</h1>
        {walletAddress && (
          <div className="flex justify-center mb-4">
            <button
              onClick={refreshInsuranceData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        )}
        {walletAddress ? (
          isLoading ? (
            <p className="text-center text-lg text-gray-700">Loading insurance data...</p>
          ) : insuranceData.length > 0 ? (
            <div className="flex flex-col gap-8 max-w-6xl mx-auto">
              {insuranceData.map((entry, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-lg shadow-md border border-gray-300"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Address: {entry.address}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {entry.insurances.map((insurance, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-300"
                      >
                        <p className="text-lg font-semibold text-gray-700">
                          Insurance Type: {insurance.type}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: <span className="text-gray-900">{insurance.id}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Purchase Price: <span className="text-gray-900">{insurance.premium || "N/A"}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Max Coverage: <span className="text-gray-900">{insurance.maxCoverage || "N/A"}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Coverage Start: <span className="text-gray-900">{insurance.startTime || "N/A"}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Coverage Ends: <span className="text-gray-900">{insurance.coverageEndDate || "N/A"}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-gray-700">
              Not refreshed or no insurance data found for this wallet address.
            </p>
          )
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">
              Please connect your wallet to view insurance data.
            </p>
            <button
              onClick={connectWallet}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </main>
    </>
  );
};