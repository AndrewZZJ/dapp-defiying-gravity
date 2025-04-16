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
    insuranceType: string;
    eventName?: string;
    eventDescription?: string;
    eventDate?: string;
  }

export const ClaimsList: React.FC = () => {
  const { walletAddress } = useWallet();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper functions to extract information from claims
  // Extract address from the description
const extractAddressFromDescription = (description: string): string => {
    return description;
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
  const fetchDisasterEvents = async (contract: ethers.Contract): Promise<Record<string, any>> => {
    try {
      // Get all disaster event IDs
      const disasterEventIds = await contract.getAllDisasterEvents();
      const eventsMap: Record<string, any> = {};
      
      // Fetch details for each event
      for (const eventId of disasterEventIds) {
        try {
          const disasterEvent = await contract.getDisasterEvent(eventId);
          // console.log(`Disaster Event ${eventId}:`, disasterEvent);
          
          // Store the event details with eventId as key
          eventsMap[eventId] = {
            id: eventId,
            name: disasterEvent.name,
            description: disasterEvent.eventDescription,
            date: disasterEvent.disasterDate ? new Date(disasterEvent.disasterDate * 1000).toISOString().split('T')[0] : ""
          };
        } catch (err) {
          console.warn(`Failed to fetch details for event ${eventId}`, err);
        }
      }
      
      return eventsMap;
    } catch (err) {
      console.warn("Failed to fetch disaster events", err);
      return {};
    }
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
      let disasterEventsCache: Record<string, Record<string, any>> = {};
  
      // First, fetch all disaster events for each contract type
      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;
  
        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
        
        // Cache disaster events for each contract type
        try {
          disasterEventsCache[type] = await fetchDisasterEvents(contract);
        } catch (err) {
          console.warn(`Could not fetch disaster events for ${type}`, err);
          disasterEventsCache[type] = {};
        }
      }
  
      // Then fetch claims and use the cached event details
      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;
  
        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
        
        try {
          const claimIds: ethers.BigNumber[] = await contract.fetchClaimIds(walletAddress);
          for (const id of claimIds) {
            const details = await contract.getClaimDetails(id);
            const eventId = details[2];
            
            // Try to get event details from our cache
            let eventDetails = null;
            for (const cacheType in disasterEventsCache) {
              if (disasterEventsCache[cacheType][eventId]) {
                eventDetails = disasterEventsCache[cacheType][eventId];
                break;
              }
            }
            
            // If event details not in cache, try direct fetch
            const disasterEvent = await contract.getDisasterEvent(eventId);
            eventDetails = {
              name: disasterEvent.eventName,
              description: disasterEvent.eventDescription,
              date: disasterEvent.disasterDate ? new Date(disasterEvent.disasterDate * 1000).toISOString().split('T')[0] : ""
            };

            // Print the event date
            console.log(`Event Date: ${eventDetails.date}`);
  
            const claim: Claim = {
              id: details[0].toString(),
              policyId: details[1],
              eventId: eventId,
              approvedAmounts: details[11].map((amt: any) => ethers.utils.formatEther(amt)),
              status: details[6],
              description: details[7],
              moderators: details[8],
              hasDecided: details[9],
              isApproved: details[10],
              insuranceType: type,
              // Add event details
              eventName: eventDetails.name,
              eventDescription: eventDetails.description,
              eventDate: eventDetails.date
            };
            // // Print Insurance type
            // console.log(`Insurance Type: ${type}`);

            // // Print this claim object
            // console.log(`Claim ID: ${claim.id}`);
            // console.log(`Claim Policy ID: ${claim.policyId}`);
            // console.log(`Claim Event ID: ${claim.eventId}`);
            // console.log(`Claim Status: ${claim.status}`);
            // console.log(`Claim Description: ${claim.description}`);
            // console.log(`Claim Moderators: ${claim.moderators}`);
            // console.log(`Claim Has Decided: ${claim.hasDecided}`);
            // console.log(`Claim Is Approved: ${claim.isApproved}`);
            // console.log(`Claim Approved Amounts: ${claim.approvedAmounts}`);
            // console.log(`Claim Event Name: ${claim.eventName}`);
            // console.log(`Claim Event Description: ${claim.eventDescription}`);
            // console.log(`Claim Event Date: ${claim.eventDate}`);

            allClaims.push(claim);
          }
        } catch (err) {
          console.warn(`Skipping ${type} — failed to fetch claims.`, err);
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
            {sortedClaims.map((claim) => {

            // Print claims
            console.log(`Claim ID: ${claim}`);

            // Determine the correct event details to use
            const eventDetails = {
                name: claim.eventName || "N/A",
                description: claim.eventDescription || `Details for ${claim.eventId} disaster event.`,
                date: claim.eventDate || ""
            };

            // Print the eventDetails details
            console.log(`Event ID: ${claim.eventId}`);
            console.log(`Event Name: ${eventDetails.name}`);
            console.log(`Event Description: ${eventDetails.description}`);
            
            return (
                <ClaimItem
                key={claim.id}
                title={`Event: ${claim.eventId}`}
                status={claim.status}
                policyId={claim.policyId}
                insuranceType={claim.insuranceType}
                information={claim.description}
                moderators={claim.moderators}
                hasDecided={claim.hasDecided}
                isApproved={claim.isApproved}
                approvedAmounts={claim.approvedAmounts}
                onCancel={claim.status === "In Progress" ? () => handleCancel(claim.id) : undefined}
                address={extractAddressFromDescription(claim.description)}
                disasterType={getDisasterTypeFromEventId(claim.eventId, claim.policyId)}
                disasterEvent={eventDetails.name}
                eventId={claim.eventId}
                eventDetails={eventDetails}
                />
            );
            })}
          </>
        )}
      </section>
    </main>
  );
};