"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { NavigationHeader } from "../navigation/AppNavigationHeader";

interface InsuranceEntry {
  address: string;
  insurances: {
    type: string;
    id: string;
    maxCoverage?: string; // Maximum coverage amount
    coverageEndDate?: string; // Coverage end date
  }[];
}

export const ViewInsurance: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet(); // Access wallet state from context
  const [insuranceData, setInsuranceData] = useState<InsuranceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle this line to use template data or backend/smart contract data
  const useTemplateData = true; // Set to `true` to use template data, otherwise backend data is used

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

  // Fetch insurance data for the connected wallet
  useEffect(() => {
    const fetchInsuranceData = async () => {
      if (!walletAddress) return;

      try {
        setIsLoading(true);

        // Fetch data from backend or use template data
        const fetchedData = useTemplateData
          ? getTemplateInsuranceData()
          : await getInsuranceData(walletAddress);

        // Fetch additional details for each insurance
        const detailedData = await Promise.all(
          fetchedData.map(async (entry) => ({
            ...entry,
            insurances: await Promise.all(
              entry.insurances.map(async (insurance) => ({
                ...insurance,
                ...(await getInsuranceDetails(insurance.id, useTemplateData)), // Fetch additional details
              }))
            ),
          }))
        );

        setInsuranceData(detailedData);
      } catch (error) {
        console.error("Failed to fetch insurance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsuranceData();
  }, [walletAddress, useTemplateData]);

  // Function to fetch insurance data from backend or smart contract
  const getInsuranceData = async (walletAddress: string): Promise<InsuranceEntry[]> => {
    // Replace this with actual backend or smart contract call
    console.log(`Fetching insurance data for wallet: ${walletAddress}`);
    return []; // Return an empty array if no data is found
  };

  // Function to fetch additional details for an insurance
  const getInsuranceDetails = async (
    id: string,
    useTemplateData: boolean
  ): Promise<{ maxCoverage: string; coverageEndDate: string }> => {
    if (useTemplateData) {
      // Return template data
      return {
        maxCoverage: "100 ETH", // Example value
        coverageEndDate: "2025-12-31", // Example value
      };
    } else {
      // Replace this with actual backend or smart contract call
      console.log(`Fetching details for insurance with id: ${id}`);
      // Simulate backend response
      return {
        maxCoverage: "Fetched from backend", // Replace with actual backend value
        coverageEndDate: "Fetched from backend", // Replace with actual backend value
      };
    }
  };

  // Template data for development purposes
  const getTemplateInsuranceData = (): InsuranceEntry[] => {
    return [
      {
        address: "123 Main St, City, State, Country",
        insurances: [
          { type: "Wildfire", id: "0xabc123" },
          { type: "Flood", id: "0xdef456" },
        ],
      },
      {
        address: "456 Business Ave, City, State, Country",
        insurances: [
          { type: "Earthquake", id: "0xghi789" },
        ],
      },
    ];
  };

  return (
    <>
      <NavigationHeader />
      <main className="relative px-8 py-12 bg-white min-h-screen">
        <h1 className="mb-12 text-4xl font-bold text-center text-gray-900">
          View Insurance
        </h1>

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
                          Max Coverage: <span className="text-gray-900">{insurance.maxCoverage || "N/A"}</span>
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
              No insurance data found for this wallet address.
            </p>
          )
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">Please connect your wallet to view insurance data.</p>
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