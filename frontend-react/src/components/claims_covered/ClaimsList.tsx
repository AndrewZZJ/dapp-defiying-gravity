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

  // Add popup state variables
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [pendingCancellation, setPendingCancellation] = useState<string | null>(null);
  const [isConfirmPopup, setIsConfirmPopup] = useState(false);

  // Helper functions to extract information from claims
  const extractAddressFromDescription = (description: string): string => {
    return description;
  };

  const getDisasterTypeFromEventId = (eventId: string, policyId: string): string => {
    if (eventId.toLowerCase().includes("fire") || eventId.toLowerCase().includes("blaze") || 
        eventId.toLowerCase().includes("palisades")) return "Wildfire";
    
    if (eventId.toLowerCase().includes("flood") || eventId.toLowerCase().includes("swell") || 
        eventId.toLowerCase().includes("river")) return "Flood";
    
    if (eventId.toLowerCase().includes("quake") || eventId.toLowerCase().includes("earth") || 
        eventId.toLowerCase().includes("shake") || eventId.toLowerCase().includes("andreas")) return "Earthquake";
    
    if (policyId.includes("Fire")) return "Wildfire";
    if (policyId.includes("Flood")) return "Flood";
    if (policyId.includes("Earthquake")) return "Earthquake";
  
    if (eventId.startsWith("EVT")) {
      const numPart = eventId.replace(/EVT#?/, "");
      const num = parseInt(numPart);
      if (num % 3 === 0) return "Earthquake";
      if (num % 3 === 1) return "Wildfire";
      return "Flood";
    }
    
    return "Natural Disaster";
  };

  const fetchDisasterEvents = async (contract: ethers.Contract): Promise<Record<string, any>> => {
    try {
      const disasterEventIds = await contract.getAllDisasterEvents();
      const eventsMap: Record<string, any> = {};
      
      for (const eventId of disasterEventIds) {
        try {
          const disasterEvent = await contract.getDisasterEvent(eventId);
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
  
      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;
  
        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
        
        try {
          disasterEventsCache[type] = await fetchDisasterEvents(contract);
        } catch (err) {
          console.warn(`Could not fetch disaster events for ${type}`, err);
          disasterEventsCache[type] = {};
        }
      }
  
      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;
  
        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
        
        try {
          const claimIds: ethers.BigNumber[] = await contract.fetchClaimIds(walletAddress);
          for (const id of claimIds) {
            const details = await contract.getClaimDetails(id);
            const eventId = details[2];
            
            let eventDetails = null;
            for (const cacheType in disasterEventsCache) {
              if (disasterEventsCache[cacheType][eventId]) {
                eventDetails = disasterEventsCache[cacheType][eventId];
                break;
              }
            }
            
            const disasterEvent = await contract.getDisasterEvent(eventId);
            eventDetails = {
              name: disasterEvent.eventName,
              description: disasterEvent.eventDescription,
              date: disasterEvent.disasterDate ? new Date(disasterEvent.disasterDate * 1000).toISOString().split('T')[0] : ""
            };

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
              eventName: eventDetails.name,
              eventDescription: eventDetails.description,
              eventDate: eventDetails.date
            };

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
    if (!walletAddress) {
      setClaims([]);
      setLoading(false);
      return;
    }
    
    fetchClaims();
  }, [walletAddress]);

  const handleCancel = async (id: string) => {
    setPopupTitle("Cancel Claim");
    setPopupMsg("Are you sure you want to cancel this claim? This action cannot be undone.");
    setIsConfirmPopup(true);
    setPendingCancellation(id);
    setShowPopup(true);
  };
  
  const confirmCancelClaim = async () => {
    if (!pendingCancellation) return;
    
    const id = pendingCancellation;
    setShowPopup(false);
    setLoading(true);
    
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
          const tx = await contract.cancelClaim(id);
          await tx.wait();
          
          setPopupTitle("Claim Cancelled");
          setPopupMsg(`Claim ${id} has been successfully canceled.`);
          setIsConfirmPopup(false);
          setShowPopup(true);
          
          fetchClaims();
          return;
        } catch (err) {
          // console.log(`Claim ${id} not found in ${type} contract`);
          setPopupTitle("Claim Cancellation Failed");
          setPopupMsg(
            (err as any)?.reason ||
              (err as any)?.message ||
              "Transaction reverted — see console for details."
          );
          setIsConfirmPopup(false);
          setShowPopup(true);
          console.error("Error cancelling claim:", err);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to cancel claim:", error);
      
      setPopupTitle("Error Cancelling Claim");
      setPopupMsg("Failed to cancel claim. See console for details.");
      setIsConfirmPopup(false);
      setShowPopup(true);
    } finally {
      setLoading(false);
      setPendingCancellation(null);
    }
  };

  const sortedClaims = [...claims].sort((a, b) => {
    if (a.status === "In Progress" && b.status !== "In Progress") return -1;
    if (a.status !== "In Progress" && b.status === "In Progress") return 1;
    return 0;
  });

  return (
    <main className="relative px-0 py-3.5 bg-gray-50 min-h-[782px]">
      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", minHeight: "250px" }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-3xl font-bold text-center">{popupTitle}</p>
              <pre className="text-sm text-center break-all whitespace-pre-wrap">
                {popupMsg}
              </pre>
              
              {isConfirmPopup ? (
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={confirmCancelClaim}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      setPendingCancellation(null);
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPopup(false)}
                  className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
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
              const eventDetails = {
                name: claim.eventName || "N/A",
                description: claim.eventDescription || `Details for ${claim.eventId} disaster event.`,
                date: claim.eventDate || ""
              };

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
                  onCancel={claim.status === "In Progress" || claim.status === "Pending" ? () => handleCancel(claim.id) : undefined}
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