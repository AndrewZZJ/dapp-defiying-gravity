"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";
import { ethers } from "ethers";


export const ClaimForm: React.FC = () => {
  const [description, setDescription] = useState("");
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<string[]>([]);
  const [insuranceOptions, setInsuranceOptions] = useState<string[]>([]); // Insurance IDs
  const [insuranceId, setInsuranceId] = useState<string | null>(null);
  const [incidentDate, setIncidentDate] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [fireAddress, setFireAddress] = useState("");
  const [floodAddress, setFloodAddress] = useState("");
  const [earthquakeAddress, setEarthquakeAddress] = useState("");

  const { walletAddress } = useWallet();

  const useMockEvents = false;

  const mockEventData: Record<string, string[]> = {
    Wildfire: ["Palisades Wildfire 2024", "Big Bear Blaze 2024"],
    Flood: ["Ohio River Flood 2024", "Louisiana Swell 2024"],
    Earthquake: ["San Andreas Shaker 2024", "Tokyo Quake 2024"],
  };

  useEffect(() => {
    if (selectedDisaster) {
      setEventOptions(mockEventData[selectedDisaster] || []);     
      setSelectedEvent(null); // Reset when changing disaster
    }
  }, [selectedDisaster]);

  // Fetch insurance IDs from all contract addresses
  useEffect(() => {
    const fetchInsuranceIds = async () => {
      if (!walletAddress) return;

      try {
        const res = await fetch("/addresses.json");
        const addresses = await res.json();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
        let allInsuranceIds: string[] = [];

        for (const type of types) {
          const contractAddress = addresses[type];
          if (!contractAddress) continue;

          const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

          try {
            const ids: string[] = await contract.fetchInsuranceIds(walletAddress);
            if (ids.length > 0) {
              allInsuranceIds = allInsuranceIds.concat(ids.map((id) => id.toString()));
            }
          } catch (err) {
            console.warn(`Skipping ${type} — no insurance found or fetch failed.`);
          }
        }

        setInsuranceOptions(allInsuranceIds);
      } catch (error) {
        console.error("Failed to fetch insurance IDs from contracts:", error);
      }
    };

    fetchInsuranceIds();
  }, [walletAddress]);

  const mockFetchInsuranceIds = async (wallet: string): Promise<string[]> => {
    console.log(`Fetching insurance IDs for wallet: ${wallet}`);
    // Mock response
    return ["InsuranceID1", "InsuranceID2", "InsuranceID3"];
  };

  const generateClaimHash = (
    wallet: string,
    disaster: string,
    event: string,
    desc: string,
    date: string,
    insId: string
  ): string => {
    const concatenated = `${wallet}-${disaster}-${event}-${desc}-${date}-${insId}`;
    return keccak256(toUtf8Bytes(concatenated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!walletAddress) return alert("Please connect your wallet first.");
    // if (!selectedDisaster || !selectedEvent || !description || !incidentDate || !insuranceId)
    //   return alert("Please fill out all fields.");
    // since we have a generic event being deployed
    if (!selectedDisaster || !description || !incidentDate || !insuranceId)
      return alert("Please fill out all fields.");
  
    try {
      const eventName = `${selectedDisaster} Generic Event`;
      // const eventName = "Wildfire Generic Event";
      const claimHash = generateClaimHash(
        walletAddress,
        selectedDisaster,
        eventName,
        description,
        incidentDate,
        insuranceId
      );
  
      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const contractAddress = addresses[selectedDisaster === "Wildfire"
        ? "FireInsurance"
        : selectedDisaster === "Flood"
        ? "FloodInsurance"
        : "EarthquakeInsurance"];
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);
      const eventDetails = await contract.disasterEvents(eventName);
  
      // Submit the claim
      const eventId = "EVT#1"; // Since each pool only has one event
      const tx = await contract.startAClaim(eventId, insuranceId, description);
      
      await tx.wait();
      // const tx = await contract.startAClaim(
      //   eventName,
      //   ethers.utils.hexZeroPad(insuranceId as string, 32), // cast to bytes32
      //   description
      // );

      // await tx.wait();
  
      console.log("Generated Claim Hash:", claimHash);
      setGeneratedHash(claimHash);
      setShowPopup(true);
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Something went wrong while submitting the claim.");
    }
  };
  

  const handlePopupOk = () => {
    setShowPopup(false);
    setGeneratedHash(null);
    setDescription("");
    setSelectedDisaster(null);
    setSelectedEvent(null);
    setEventOptions([]);
    setIncidentDate("");
    setInsuranceId(null);
  };

  const disasterOptions = [
    { title: "Wildfire", color: "bg-orange-500" },
    { title: "Flood", color: "bg-blue-300" },
    { title: "Earthquake", color: "bg-tan-500" },
  ];

  const selectedColor =
    disasterOptions.find((d) => d.title === selectedDisaster)?.color || "bg-white";

  return (
    <div className="w-full bg-gray-50 flex justify-center py-6 px-4">
      <section className="w-full max-w-2xl bg-white p-8 rounded-lg border border-zinc-300 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Disaster Type Dropdown */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Disaster Type
            </label>
            <div className={`relative border border-zinc-300 rounded-md shadow-sm ${selectedColor}`}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="flex items-center justify-between w-full px-3 py-2 text-left"
              >
                <div className="text-sm font-medium">
                  {selectedDisaster || "Select a disaster type"}
                </div>
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 bg-white border border-zinc-300 rounded-md shadow-md z-10">
                  {disasterOptions.map((option) => (
                    <button
                      key={option.title}
                      onClick={() => {
                        setSelectedDisaster(option.title);
                        setIsDropdownOpen(false);
                      }}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                    >
                      {option.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Disaster Event Dropdown */}
          {selectedDisaster && (
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Select Disaster Event
              </label>
              <select
                className="w-full p-2 border border-zinc-300 rounded-md"
                value={selectedEvent || ""}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="" disabled>Select an event</option>
                {eventOptions.map((eventName, index) => (
                  <option key={index} value={eventName}>
                    {eventName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Incident Date */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Date of Incident
            </label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded-md"
            />
          </div>

          {/* Insurance ID Dropdown */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Insurance ID
            </label>
            <select
              className="w-full p-2 border border-zinc-300 rounded-md"
              value={insuranceId || ""}
              onChange={(e) => setInsuranceId(e.target.value)}
            >
              <option value="" disabled>Select an insurance ID</option>
              {insuranceOptions.map((id, index) => (
                <option key={index} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Incident Description
            </label>
            <textarea
              className="w-full p-3 border border-zinc-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Describe the incident and include links to any evidence (e.g., images, videos, or documents)."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full p-3 text-base rounded-md bg-black text-white hover:bg-gray-800"
          >
            Submit Claim
          </button>
        </form>
      </section>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-3xl font-bold text-center">
                Form Successfully Submitted to Moderators
              </p>
              {generatedHash && (
                <p className="text-sm text-center break-all">
                  Generated Hash: <br /> <code>{generatedHash}</code>
                </p>
              )}
              <button
                onClick={handlePopupOk}
                className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};