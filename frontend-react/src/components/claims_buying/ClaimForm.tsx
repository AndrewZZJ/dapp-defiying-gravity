"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

export const ClaimForm: React.FC = () => {
  const [description, setDescription] = useState("");
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const { walletAddress } = useWallet(); // Access wallet state from context

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function submitClaim(string disasterType, string description, string evidenceHash) public",
  ];

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Replace this with actual IPFS or decentralized storage integration
    // For example, using Pinata or Web3.Storage
    const mockHash = "QmExampleHash"; // Replace with the actual hash from IPFS
    console.log("Uploading file to IPFS:", file.name);
    return mockHash;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!selectedDisaster || !description || !evidenceFile) {
      alert("Please fill out all fields and upload evidence.");
      return;
    }

    try {
      // Upload evidence to IPFS
      const evidenceHash = await uploadToIPFS(evidenceFile);

      // Interact with the smart contract
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.submitClaim(selectedDisaster, description, evidenceHash);
      await tx.wait();

      setShowPopup(true); // Show success popup

      // Reset form
      setDescription("");
      setSelectedDisaster(null);
      setEvidenceFile(null);
    } catch (error) {
      console.error("Failed to submit claim:", error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
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
          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Incident Description
            </label>
            <textarea
              className="w-full p-3 border border-zinc-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Describe the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          {/* Disaster Type Dropdown */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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

          {/* Image Upload */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Upload Evidence (Image)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setEvidenceFile(e.target.files ? e.target.files[0] : null)
              }
              className="block w-full text-sm text-gray-900 border border-zinc-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            />
            {evidenceFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {evidenceFile.name}
              </p>
            )}
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

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-50"></div>

          {/* Popup Box */}
          <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
          >
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-red-600 hover:text-white"
            >
              <span className="font-bold text-lg">X</span>
            </button>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-3xl font-bold text-center mb-4">Claim Submitted</p>
              <p className="text-lg text-center">Your claim has been successfully submitted and is under review.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
