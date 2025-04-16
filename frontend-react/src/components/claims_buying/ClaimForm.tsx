"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";
import { ethers } from "ethers";

// Define the structure for a disaster event
interface DisasterEvent {
  id: string;
  name: string;
  description: string;
  date: string;
}

export const ClaimForm: React.FC = () => {
  const [description, setDescription] = useState("");
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<DisasterEvent[]>([]);
  const [disasterEvents, setDisasterEvents] = useState<Record<string, DisasterEvent[]>>({
    Wildfire: [],
    Flood: [],
    Earthquake: []
  });
  const [insuranceOptions, setInsuranceOptions] = useState<
    { id: string; type: string }[]
  >([]);
  const [filteredInsuranceOptions, setFilteredInsuranceOptions] = useState<
    { id: string; type: string }[]
  >([]);
  const [insuranceId, setInsuranceId] = useState<string | null>(null);
  const [incidentDate, setIncidentDate] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupDescription, setPopupDescription] = useState<string | null>(null);

  const { walletAddress } = useWallet();

  // Update event options when a disaster type is selected
  useEffect(() => {
    if (selectedDisaster) {
      setEventOptions(disasterEvents[selectedDisaster] || []);
      setSelectedEvent(null);
      setSelectedEventId(null);
    }
  }, [selectedDisaster, disasterEvents]);

  // Fetch insurance IDs and disaster events from all contract addresses
  useEffect(() => {
    const fetchContractData = async () => {
      if (!walletAddress) return;

      try {
        const res = await fetch("/addresses.json");
        const addresses = await res.json();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
        const disasterTypes = ["Wildfire", "Flood", "Earthquake"];
        let allInsuranceIds: { id: string; type: string }[] = [];
        const allDisasterEvents: Record<string, DisasterEvent[]> = {
          Wildfire: [],
          Flood: [],
          Earthquake: []
        };

        for (let i = 0; i < types.length; i++) {
          const type = types[i];
          const disasterType = disasterTypes[i];
          const contractAddress = addresses[type];
          
          if (!contractAddress) continue;

          const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

          // Fetch insurance IDs
          try {
            const ids: string[] = await contract.fetchInsuranceIds(walletAddress);
            if (ids.length > 0) {
              allInsuranceIds = allInsuranceIds.concat(
                ids.map((id) => ({ id: id.toString(), type }))
              );
            }
          } catch (err) {
            console.warn(`Skipping ${type} — no insurance found or fetch failed.`);
          }

          // Fetch disaster events
          try {
            const disasterEventIds = await contract.getAllDisasterEvents();
            
            for (const eventId of disasterEventIds) {
              const disasterEvent = await contract.getDisasterEvent(eventId);
              allDisasterEvents[disasterType].push({
                id: eventId,
                name: disasterEvent.eventName,
                description: disasterEvent.eventDescription,
                date: new Date(disasterEvent.disasterDate * 1000).toISOString().split('T')[0]
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch disaster events for ${type}:`, err);
          }
        }

        setInsuranceOptions(allInsuranceIds);
        setFilteredInsuranceOptions(allInsuranceIds);
        setDisasterEvents(allDisasterEvents);
      } catch (error) {
        console.error("Failed to fetch data from contracts:", error);
      }
    };

    fetchContractData();
  }, [walletAddress]);

  // Filter insurance options based on selected disaster type
  useEffect(() => {
    if (selectedDisaster) {
      const typeKey =
        selectedDisaster === "Wildfire"
          ? "FireInsurance"
          : selectedDisaster === "Flood"
          ? "FloodInsurance"
          : "EarthquakeInsurance";

      setFilteredInsuranceOptions(
        insuranceOptions.filter((option) => option.type === typeKey)
      );
    } else {
      setFilteredInsuranceOptions(insuranceOptions);
    }
  }, [selectedDisaster, insuranceOptions]);

  const handleInsuranceIdChange = (id: string) => {
    setInsuranceId(id);

    // Auto-select disaster type if not already selected
    if (!selectedDisaster) {
      const selectedInsurance = insuranceOptions.find((option) => option.id === id);
      if (selectedInsurance) {
        const disasterType =
          selectedInsurance.type === "FireInsurance"
            ? "Wildfire"
            : selectedInsurance.type === "FloodInsurance"
            ? "Flood"
            : "Earthquake";
        setSelectedDisaster(disasterType);
      }
    }
  };

  const handleEventChange = (eventName: string) => {
    setSelectedEvent(eventName);
    // Find the event ID based on the selected event name
    const event = eventOptions.find(event => event.name === eventName);
    if (event) {
      setSelectedEventId(event.id);
    }
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
    if (!selectedDisaster || !selectedEventId || !description || !incidentDate || !insuranceId)
      return alert("Please fill out all fields.");

    try {
      // const claimHash = generateClaimHash(
      //   walletAddress,
      //   selectedDisaster,
      //   selectedEvent || "",
      //   description,
      //   incidentDate,
      //   insuranceId
      // );

      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const contractAddress =
        selectedDisaster === "Wildfire"
          ? addresses["FireInsurance"]
          : selectedDisaster === "Flood"
          ? addresses["FloodInsurance"]
          : addresses["EarthquakeInsurance"];

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

      // Submit the claim using the actual event ID
      const tx = await contract.startAClaim(selectedEventId, insuranceId, description);

      await tx.wait();

      // Get the transaction ID
      const txReceipt = await provider.getTransactionReceipt(tx.hash);
      const txId = txReceipt.transactionHash;

      // console.log("Generated Claim Hash:", claimHash);
      // setGeneratedHash(claimHash);
      setPopupDescription("Claim File submitted successfully!\nTransaction ID: " + txId);
      setShowPopup(true);
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Something went wrong while submitting the claim.");
    }
  };

  const handlePopupOk = () => {
    setShowPopup(false);
    setPopupDescription(null);
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
                onChange={(e) => handleEventChange(e.target.value)}
              >
                <option value="" disabled>
                  Select an event
                </option>
                {eventOptions.map((event, index) => (
                  <option key={index} value={event.name}>
                    {event.name} - {event.date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Insurance ID Dropdown */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Insurance ID
            </label>
            <select
              className="w-full p-2 border border-zinc-300 rounded-md"
              value={insuranceId || ""}
              onChange={(e) => handleInsuranceIdChange(e.target.value)}
            >
              <option value="" disabled>
                Select an insurance ID
              </option>
              {filteredInsuranceOptions.map((option, index) => (
                <option key={index} value={option.id}>
                  {option.id}
                </option>
              ))}
            </select>
          </div>

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
              {popupDescription && (
                <p className="text-sm text-center break-all">
                  {popupDescription}
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