"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

export const ClaimForm: React.FC = () => {
  const [description, setDescription] = useState("");
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<string[]>([]);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);

  const [incidentDate, setIncidentDate] = useState("");
  const [insuranceId, setInsuranceId] = useState("");

  const { walletAddress } = useWallet();

  const useMockEvents = true;

  const mockEventData: Record<string, string[]> = {
    Wildfire: ["Palisades Wildfire 2024", "Big Bear Blaze 2024"],
    Flood: ["Ohio River Flood 2024", "Louisiana Swell 2024"],
    Earthquake: ["San Andreas Shaker 2024", "Tokyo Quake 2024"],
  };

  useEffect(() => {
    if (selectedDisaster) {
      if (useMockEvents) {
        setEventOptions(mockEventData[selectedDisaster] || []);
      } else {
        // Future: Replace with API fetch for real-time events
        setEventOptions([]);
      }
      setSelectedEvent(null); // Reset selected event when disaster changes
    }
  }, [selectedDisaster]);

  const uploadToIPFS = async (file: File): Promise<string> => {
    const mockHash = "QmExampleHash";
    console.log("Uploading file to IPFS:", file.name);
    return mockHash;
  };

  const generateClaimHash = (
    wallet: string,
    disaster: string,
    event: string,
    desc: string,
    evHash: string,
    date: string,
    insId: string
  ): string => {
    const concatenated = `${wallet}-${disaster}-${event}-${desc}-${evHash}-${date}-${insId}`;
    return keccak256(toUtf8Bytes(concatenated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    if (
      !selectedDisaster ||
      !selectedEvent ||
      !description ||
      !evidenceFile ||
      !incidentDate ||
      !insuranceId
    ) {
      alert("Please fill out all fields and upload evidence.");
      return;
    }

    try {
      const evidenceHash = await uploadToIPFS(evidenceFile);
      const claimHash = generateClaimHash(
        walletAddress,
        selectedDisaster,
        selectedEvent,
        description,
        evidenceHash,
        incidentDate,
        insuranceId
      );
      console.log("Generated Claim Hash:", claimHash);

      setGeneratedHash(claimHash);
      setShowPopup(true);
    } catch (error) {
      console.error("Error generating claim hash:", error);
      alert("Something went wrong while generating the claim hash.");
    }
  };

  const handlePopupOk = () => {
    setShowPopup(false);
    setGeneratedHash(null);
    setDescription("");
    setSelectedDisaster(null);
    setSelectedEvent(null);
    setEventOptions([]);
    setEvidenceFile(null);
    setIncidentDate("");
    setInsuranceId("");
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

          {/* Insurance ID */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Insurance ID / Hash
            </label>
            <input
              type="text"
              value={insuranceId}
              onChange={(e) => setInsuranceId(e.target.value)}
              placeholder="Enter Insurance ID"
              className="w-full p-3 border border-zinc-300 rounded-md"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
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

          {/* Image Upload */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
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
            Generate Claim Hash
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
                Form Successfully Submitted to the Oracle
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

// "use client";
// import React, { useState } from "react";
// import { useWallet } from "../../context/WalletContext";
// import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

// export const ClaimForm: React.FC = () => {
//   const [description, setDescription] = useState("");
//   const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
//   const [showPopup, setShowPopup] = useState(false);
//   const [generatedHash, setGeneratedHash] = useState<string | null>(null);

//   const [incidentDate, setIncidentDate] = useState("");
//   const [incidentCity, setIncidentCity] = useState("");
//   const [incidentCountry, setIncidentCountry] = useState("");
//   const [insuranceId, setInsuranceId] = useState("");

//   const { walletAddress } = useWallet();

//   const uploadToIPFS = async (file: File): Promise<string> => {
//     const mockHash = "QmExampleHash"; // Replace with real IPFS integration
//     console.log("Uploading file to IPFS:", file.name);
//     return mockHash;
//   };

//   const generateClaimHash = (
//     wallet: string,
//     disaster: string,
//     desc: string,
//     evHash: string,
//     date: string,
//     city: string,
//     country: string,
//     insId: string
//   ): string => {
//     const concatenated = `${wallet}-${disaster}-${desc}-${evHash}-${date}-${city}-${country}-${insId}`;
//     return keccak256(toUtf8Bytes(concatenated));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!walletAddress) {
//       alert("Please connect your wallet first.");
//       return;
//     }

//     if (!selectedDisaster || !description || !evidenceFile || !incidentDate || !incidentCity || !incidentCountry || !insuranceId) {
//       alert("Please fill out all fields and upload evidence.");
//       return;
//     }

//     try {
//       const evidenceHash = await uploadToIPFS(evidenceFile);
//       const claimHash = generateClaimHash(
//         walletAddress,
//         selectedDisaster,
//         description,
//         evidenceHash,
//         incidentDate,
//         incidentCity,
//         incidentCountry,
//         insuranceId
//       );
//       console.log("Generated Claim Hash:", claimHash);

//       setGeneratedHash(claimHash);
//       setShowPopup(true);
//     } catch (error) {
//       console.error("Error generating claim hash:", error);
//       alert("Something went wrong while generating the claim hash.");
//     }
//   };

//   const handlePopupOk = () => {
//     setShowPopup(false);
//     setGeneratedHash(null);
//     setDescription("");
//     setSelectedDisaster(null);
//     setEvidenceFile(null);
//     setIncidentDate("");
//     setIncidentCity("");
//     setIncidentCountry("");
//     setInsuranceId("");
//   };

//   const disasterOptions = [
//     { title: "Wildfire", color: "bg-orange-500" },
//     { title: "Flood", color: "bg-blue-300" },
//     { title: "Earthquake", color: "bg-tan-500" },
//   ];

//   const selectedColor =
//     disasterOptions.find((d) => d.title === selectedDisaster)?.color || "bg-white";

//   return (
//     <div className="w-full bg-gray-50 flex justify-center py-6 px-4">
//       <section className="w-full max-w-2xl bg-white p-8 rounded-lg border border-zinc-300 shadow-sm">
//         <form onSubmit={handleSubmit} className="flex flex-col gap-6">

//           {/* Disaster Type Dropdown */}
//           <div>
//             <label className="block text-lg font-semibold text-gray-700 mb-2">
//               Select Disaster Type
//             </label>
//             <div className={`relative border border-zinc-300 rounded-md shadow-sm ${selectedColor}`}>
//               <button
//                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                 type="button"
//                 className="flex items-center justify-between w-full px-3 py-2 text-left"
//               >
//                 <div className="text-sm font-medium">
//                   {selectedDisaster || "Select a disaster type"}
//                 </div>
//               </button>
//               {isDropdownOpen && (
//                 <div className="absolute left-0 right-0 bg-white border border-zinc-300 rounded-md shadow-md z-10">
//                   {disasterOptions.map((option) => (
//                     <button
//                       key={option.title}
//                       onClick={() => {
//                         setSelectedDisaster(option.title);
//                         setIsDropdownOpen(false);
//                       }}
//                       type="button"
//                       className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
//                     >
//                       {option.title}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Disaster Event Fields */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-lg font-semibold text-gray-700 mb-2">
//                 Date of Incident
//               </label>
//               <input
//                 type="date"
//                 value={incidentDate}
//                 onChange={(e) => setIncidentDate(e.target.value)}
//                 className="w-full p-2 border border-zinc-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-lg font-semibold text-gray-700 mb-2">
//                 City
//               </label>
//               <input
//                 type="text"
//                 value={incidentCity}
//                 onChange={(e) => setIncidentCity(e.target.value)}
//                 placeholder="City"
//                 className="w-full p-2 border border-zinc-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-lg font-semibold text-gray-700 mb-2">
//                 Country
//               </label>
//               <input
//                 type="text"
//                 value={incidentCountry}
//                 onChange={(e) => setIncidentCountry(e.target.value)}
//                 placeholder="Country"
//                 className="w-full p-2 border border-zinc-300 rounded-md"
//               />
//             </div>
//           </div>

//           {/* Insurance ID */}
//           <div>
//             <label className="block text-lg font-semibold text-gray-700 mb-2">
//               Insurance ID / Hash
//             </label>
//             <input
//               type="text"
//               value={insuranceId}
//               onChange={(e) => setInsuranceId(e.target.value)}
//               placeholder="Enter Insurance ID"
//               className="w-full p-3 border border-zinc-300 rounded-md"
//             />
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-lg font-semibold text-gray-700 mb-2">
//               Incident Description
//             </label>
//             <textarea
//               className="w-full p-3 border border-zinc-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black"
//               placeholder="Describe the incident..."
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               rows={5}
//             />
//           </div>

//           {/* Image Upload */}
//           <div>
//             <label className="block text-lg font-semibold text-gray-700 mb-2">
//               Upload Evidence (Image)
//             </label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) =>
//                 setEvidenceFile(e.target.files ? e.target.files[0] : null)
//               }
//               className="block w-full text-sm text-gray-900 border border-zinc-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
//             />
//             {evidenceFile && (
//               <p className="mt-2 text-sm text-gray-600">
//                 Selected file: {evidenceFile.name}
//               </p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full p-3 text-base rounded-md bg-black text-white hover:bg-gray-800"
//           >
//             Generate Claim Hash
//           </button>
//         </form>
//       </section>

//       {/* Success Popup */}
//       {showPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="absolute inset-0 bg-black opacity-50"></div>
//           <div
//             className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
//             style={{ width: "600px", height: "300px" }}
//           >
//             <div className="flex flex-col items-center justify-center h-full space-y-4">
//               <p className="text-3xl font-bold text-center">Form Successfully Submitted to the Oracle</p>
//               {generatedHash && (
//                 <p className="text-sm text-center break-all">
//                   Generated Hash: <br /> <code>{generatedHash}</code>
//                 </p>
//               )}
//               <button
//                 onClick={handlePopupOk}
//                 className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
//               >
//                 OK
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
