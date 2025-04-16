"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

// Update the ClaimItemProps interface

interface ClaimItemProps {
    title: string;
    status: string;
    policyId: string;
    insuranceType: string;
    information: string;
    moderators: string[];
    hasDecided: boolean[];
    isApproved: boolean[];
    approvedAmounts: string[];
    onCancel?: () => void;
    address?: string;
    disasterType?: string;
    disasterEvent?: string;
    eventId: string;
    eventDetails?: {
      name: string;
      description: string;
      date: string;
    };
  }

export const ClaimItem: React.FC<ClaimItemProps> = ({
  title,
  status,
  policyId,
  insuranceType,
  information,
  moderators,
  hasDecided,
  isApproved,
  approvedAmounts,
  onCancel,
  // Enhanced property handling
  address = "Property Address",
  disasterType = "Natural Disaster",
  disasterEvent = "Event",
  eventId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState(address);
  const [eventDetails, setEventDetails] = useState({
    name: disasterEvent,
    description: "",
    date: ""
  });
  // Add a state for the display disaster type
  const [displayDisasterType, setDisplayDisasterType] = useState(disasterType);

  useEffect(() => {
    // Fetch property address from policy and event details
    const fetchAdditionalData = async () => {
      try {
        const res = await fetch("/addresses.json");
        const addresses = await res.json();

        console.log("Insurance Type:", insuranceType);
        
        // Determine which contract to use based on insurance type
        let contractKey = "EarthquakeInsurance";
        if (insuranceType === "FireInsurance") contractKey = "FireInsurance";
        if (insuranceType === "FloodInsurance") contractKey = "FloodInsurance";
        
        // Map contract keys to human-readable disaster types
        let displayType = "Earthquake";
        if (contractKey === "FireInsurance") displayType = "Wildfire";
        if (contractKey === "FloodInsurance") displayType = "Flood";
        
        // Update the display disaster type
        setDisplayDisasterType(displayType);
        
        console.log("Contract Key:", contractKey);

        const contractAddress = addresses[insuranceType];
        if (!contractAddress) return;

        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
        
        // Get property address from policy
        if (policyId) {
          try {
            const policyDetails = await contract.getUserPolicy(policyId);
            // console.log("Policy Details:", policyDetails);
            if (policyDetails._propertyAddress) {
              setPropertyAddress(policyDetails._propertyAddress);
              // console.log("Property Address:", policyDetails._propertyAddress);
            }
          } catch (err) {
            console.warn("Could not fetch policy details", err);
          }
        }

        // Get disaster event details
        if (eventId) {
          try {
            // From the smart contract we saw the getDisasterEvent function
            const eventData = await contract.getDisasterEvent(eventId);
            // console.log("Event Data:", eventData);
            setEventDetails({
              name: eventData.eventName || "", // Use the display type here
              description: eventData.eventDescription || "",
              date: new Date(eventData.disasterDate * 1000).toISOString().split('T')[0] || ""
            });
          } catch (err) {
            console.warn("Could not fetch event details", err);
          }
        }
      } catch (error) {
        console.error("Error fetching additional data:", error);
      }
    };

    fetchAdditionalData();
  }, [policyId, eventId, insuranceType]);

  const statusConfig = {
    Approved: {
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: "✓",
    },
    Declined: {
      textColor: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: "✕",
    },
    "In Progress": {
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: "⋯",
    },
  };

  // Disaster type configurations for styling
  const disasterConfig: Record<string, { color: string, bgColor: string, icon: string }> = {
    Wildfire: {
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      icon: "🔥"
    },
    Flood: {
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      icon: "💧"
    },
    Earthquake: {
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: "🌋"
    }
  };

  // Update to use displayDisasterType instead of disasterType
  const currentDisaster = disasterConfig[displayDisasterType] || disasterConfig.Earthquake;
  const currentStatus = status as keyof typeof statusConfig;
  const { textColor, bgColor, borderColor, icon } = statusConfig[currentStatus] || {
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: "",
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className={`w-full rounded-lg bg-white shadow-sm border ${borderColor} overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div className="w-full">
        {/* Header section with disaster type badge and status */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {/* Disaster Type Icon Badge */}
            <div className={`flex-shrink-0 w-12 h-12 ${currentDisaster.bgColor} rounded-lg flex items-center justify-center shadow-sm`}>
              <span className="text-xl">{currentDisaster.icon}</span>
            </div>
            
            <div className="flex-1">
              {/* Disaster Type and Event */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${currentDisaster.bgColor} ${currentDisaster.color}`}>
                  {displayDisasterType}
                </span>
                <h3 className="text-lg font-semibold text-gray-800">{eventDetails.name}</h3>
              </div>
              
              {/* Property Address */}
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                {propertyAddress}
              </p>
              
              {/* Event Date (if available) */}
              {eventDetails.date && (
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {formatDate(eventDetails.date)}
                </p>
              )}
              
              {/* Policy ID (smaller, less emphasis) */}
              <p className="text-xs text-gray-500 mt-1">
                Policy ID: {policyId.slice(0, 10)}...{policyId.slice(-6)}
              </p>
            </div>
          </div>

          {/* Status Badge and Expand Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                <span className="text-sm">{icon}</span>
                {status}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls={`claim-info-${policyId}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
            >
              {isOpen ? "Hide Details" : "View Details"}
              <span className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
          {/* Claim Description Panel */}
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Claim Description:</h4>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
              {information}
            </div>
            
            {/* Event Description (if available) */}
            {eventDetails.description && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Event Description:</h4>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {eventDetails.description}
                </div>
              </div>
            )}
          </div>

          {/* Moderator Decisions Panel */}
          {(status === "Approved" || status === "Declined") && moderators.length > 0 && (
            <div className="p-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Moderator Decisions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {moderators.map((mod, idx) => {
                  let decisionColor = "text-gray-500";
                  let decisionBg = "bg-gray-50";
                  let decisionText = "No decision yet";
                  let decisionIcon = "⌛";
                  
                  if (hasDecided[idx]) {
                    if (isApproved[idx]) {
                      decisionColor = "text-green-600";
                      decisionBg = "bg-green-50";
                      decisionText = `Approved (${approvedAmounts[idx]} ETH)`;
                      decisionIcon = "✓";
                    } else {
                      decisionColor = "text-red-500";
                      decisionBg = "bg-red-50";
                      decisionText = "Declined";
                      decisionIcon = "✕";
                    }
                  }
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 shadow-sm">
                      <span className="text-sm font-mono text-gray-800">
                        {mod.slice(0, 6)}...{mod.slice(-4)}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${decisionBg} ${decisionColor}`}>
                        <span>{decisionIcon}</span>
                        {decisionText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Cancel Button */}
          {status === "In Progress" && (
            <div className="p-5 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Claim
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};