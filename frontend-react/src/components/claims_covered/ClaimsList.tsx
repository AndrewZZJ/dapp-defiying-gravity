"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { ClaimItem } from "./ClaimItem";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

interface Claim {
  id: string;
  policyId: string;
  eventId: string;
  status: string;
  description: string;
  moderators: string[];
  hasDecided: boolean[];
  isApproved: boolean[];
  approvedAmounts: string[];
}

export const ClaimsList: React.FC = () => {
  const { walletAddress } = useWallet();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper functions to extract information from claims
  // Extract address from the description
const extractAddressFromDescription = (description: string): string => {
    // Look for address patterns in the description
    const addressMatch = description.match(/at\s+([\d\w\s]+(?:Avenue|Lane|Road|Street|Ave|Ln|Rd|St|Drive|Dr|Boulevard|Blvd|Court|Ct|Circle|Cir)[\s\w\d,]*)/i);
    return addressMatch ? addressMatch[1] : "Property Address";
  };
  
  // Extract or determine disaster type from event ID
  const getDisasterTypeFromEventId = (eventId: string, policyId: string): string => {
    if (eventId.toLowerCase().includes("fire") || eventId.toLowerCase().includes("blaze") || 
        eventId.toLowerCase().includes("palisades")) return "Wildfire";
    
    if (eventId.toLowerCase().includes("flood") || eventId.toLowerCase().includes("swell") || 
        eventId.toLowerCase().includes("river")) return "Flood";
    
    if (eventId.toLowerCase().includes("quake") || eventId.toLowerCase().includes("earth") || 
        eventId.toLowerCase().includes("shake") || eventId.toLowerCase().includes("andreas")) return "Earthquake";
    
    // Check policy ID if event doesn't give clues
    if (policyId.includes("Fire")) return "Wildfire";
    if (policyId.includes("Flood")) return "Flood";
    if (policyId.includes("Earthquake")) return "Earthquake";
  
    // Default based on format from the screenshots
    if (eventId.startsWith("EVT")) {
      const numPart = eventId.replace(/EVT#?/, "");
      const num = parseInt(numPart);
      if (num % 3 === 0) return "Earthquake";
      if (num % 3 === 1) return "Wildfire";
      return "Flood";
    }
    
    return "Natural Disaster";
  };
  
  // Extract or determine disaster event name
  const getEventNameFromEventId = (eventId: string): string => {
    // Handle specific known events with better names
    const eventMap: Record<string, string> = {
      "EVT#1": "California Wildfire 2025",
      "EVT1": "California Wildfire 2025",
      "EVT#2": "Mississippi River Flood 2025",
      "EVT2": "Mississippi River Flood 2025",
      "EVT#3": "San Andreas Earthquake 2025",
      "EVT3": "San Andreas Earthquake 2025"
    };
    
    if (eventMap[eventId]) {
      return eventMap[eventId];
    }
    
    // If it's one of the mock events, just return it as is
    if (eventId.includes("Palisades") || 
        eventId.includes("Big Bear") || 
        eventId.includes("Ohio River") || 
        eventId.includes("Louisiana") || 
        eventId.includes("San Andreas") || 
        eventId.includes("Tokyo")) {
      return eventId;
    }
    
    // Default formatting for generic event IDs
    return eventId.replace(/EVT#?/, "Event #");
  };

  const fetchClaims = async () => {
    if (!walletAddress) {
      setClaims([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
      let allClaims: Claim[] = [];

      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;

        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

        try {
          const claimIds: ethers.BigNumber[] = await contract.fetchClaimIds(walletAddress);
          for (const id of claimIds) {
            const details = await contract.getClaimDetails(id);

            const claim: Claim = {
              id: details[0].toString(),
              policyId: details[1],
              eventId: details[2],
              approvedAmounts: details[11].map((amt: any) => ethers.utils.formatEther(amt)),
              status: details[6], // already string from contract
              description: details[7],
              moderators: details[8],
              hasDecided: details[9],
              isApproved: details[10],
            };

            allClaims.push(claim);
          }
        } catch (err) {
          console.warn(`Skipping ${type} — failed to fetch claims.`);
        }
      }

      setClaims(allClaims);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear claims when wallet disconnects
    if (!walletAddress) {
      setClaims([]);
      setLoading(false);
      return;
    }
    
    fetchClaims();
  }, [walletAddress]);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this claim? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
      
      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;

        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

        try {
          // Check if this claim exists in this contract
          const tx = await contract.cancelClaim(id);
          await tx.wait();
          alert(`Claim ${id} has been successfully canceled.`);
          
          // Refresh the list
          fetchClaims();
          return;
        } catch (err) {
          // If the claim isn't found in this contract, it will throw an error
          console.log(`Claim ${id} not found in ${type} contract`);
        }
      }
      
      alert("Could not find this claim in any contract.");
    } catch (error) {
      console.error("Failed to cancel claim:", error);
      alert("Failed to cancel claim. See console for details.");
    }
  };

  const sortedClaims = [...claims].sort((a, b) => {
    if (a.status === "In Progress" && b.status !== "In Progress") return -1;
    if (a.status !== "In Progress" && b.status === "In Progress") return 1;
    return 0;
  });

  return (
    <main className="relative px-0 py-3.5 bg-gray-50 min-h-[782px]">
      <section className="flex flex-col gap-4 p-16 mx-auto max-w-screen-md max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mb-4"></div>
            <p className="text-center text-lg font-medium text-gray-700">Loading claims...</p>
          </div>
        ) : sortedClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-center text-lg font-medium text-gray-700">No claims found</p>
            <p className="text-center text-gray-500 mt-2">Submit a new claim to get started</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Claims</h2>
            {sortedClaims.map((claim) => (
            <ClaimItem
                key={claim.id}
                title={`Event: ${claim.eventId}`}
                status={claim.status}
                policyId={claim.policyId}
                information={claim.description}
                moderators={claim.moderators}
                hasDecided={claim.hasDecided}
                isApproved={claim.isApproved}
                approvedAmounts={claim.approvedAmounts}
                onCancel={claim.status === "In Progress" ? () => handleCancel(claim.id) : undefined}
                address={extractAddressFromDescription(claim.description)}
                disasterType={getDisasterTypeFromEventId(claim.eventId, claim.policyId)}
                disasterEvent={getEventNameFromEventId(claim.eventId)}
                eventId={claim.eventId} // Pass the eventId to allow fetching event details
            />
            ))}
          </>
        )}
      </section>
    </main>
  );
};