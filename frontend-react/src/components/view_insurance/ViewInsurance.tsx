"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { NavigationHeader } from "../navigation/AppNavigationHeader";

export const ViewInsurance: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [insuranceData, setInsuranceData] = useState<
    { address: string; insurances: { type: string; hash: string }[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle this line to use template data or backend/smart contract data
  const useTemplateData = true; // Set to `true` to use template data, otherwise backend data is used

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

        setInsuranceData(fetchedData);
      } catch (error) {
        console.error("Failed to fetch insurance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsuranceData();
  }, [walletAddress, useTemplateData]);

  // Function to fetch insurance data from backend or smart contract
  const getInsuranceData = async (walletAddress: string) => {
    // Replace this with actual backend or smart contract call
    console.log(`Fetching insurance data for wallet: ${walletAddress}`);
    return []; // Return an empty array if no data is found
  };

  // Template data for development purposes
  const getTemplateInsuranceData = () => {
    return [
      {
        address: "123 Main St, City, State, Country",
        insurances: [
          { type: "Wildfire", hash: "0xabc123" },
          { type: "Flood", hash: "0xdef456" },
        ],
      },
      {
        address: "456 Business Ave, City, State, Country",
        insurances: [
          { type: "Earthquake", hash: "0xghi789" },
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
                          ID: <span className="text-gray-900">{insurance.hash}</span>
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
              onClick={() => {
                if (typeof window.ethereum !== "undefined") {
                  window.ethereum.request({ method: "eth_requestAccounts" });
                } else {
                  alert("Please install MetaMask to connect your wallet.");
                }
              }}
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