"use client";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";

interface ClaimItemProps {
  title: string;
  status: string;
  policyId: string;
  information: string;
  moderators: string[];
  hasDecided: boolean[];
  isApproved: boolean[];
  approvedAmounts: string[];
  onCancel?: () => void;
}

export const ClaimItem: React.FC<ClaimItemProps> = ({
  title,
  status,
  policyId,
  information,
  moderators,
  hasDecided,
  isApproved,
  approvedAmounts,
  onCancel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusColor = {
    Approved: "text-green-600",
    Declined: "text-red-500",
    "In Progress": "text-yellow-500",
  };

  return (
    <div className="w-full border border-zinc-300 rounded-lg bg-white shadow-sm">
      <div className="w-full p-4">
        {/* Top Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 items-start">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-lg font-medium text-stone-900 break-words">
              {title}
            </h3>
            <p className="text-sm text-gray-500">Policy ID: {policyId}</p>

            {/* Moderator Breakdown */}
            {(status === "Approved" || status === "Declined") && moderators.length > 0 && (
              <div className="text-sm text-gray-500 mt-2">
                Moderator Decisions:
                <ul className="list-disc pl-4 text-gray-900 font-medium">
                  {moderators.map((mod, idx) => (
                    <li key={idx}>
                      {mod.slice(0, 6)}...
                      {mod.slice(-4)} —{" "}
                      {hasDecided[idx]
                        ? isApproved[idx]
                          ? `Approved (${approvedAmounts[idx]} ETH)`
                          : "Declined"
                        : "No decision yet"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Status and Expand */}
          <div className="flex items-start sm:justify-end gap-3 mt-2 sm:mt-0">
            <span className={`text-sm font-semibold ${statusColor[status as keyof typeof statusColor] || "text-black"}`}>
              {status}
            </span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls={`claim-info-${policyId}`}
            >
              {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
          </div>
        </div>

        {/* Description Panel */}
        {isOpen && (
          <div
            id={`claim-info-${policyId}`}
            className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap"
          >
            {information}
          </div>
        )}

        {/* Cancel Button */}
        {status === "In Progress" && (
          <div className="mt-4 text-right">
            <button
              onClick={onCancel}
              className="text-sm px-4 py-1.5 border border-red-500 text-red-500 rounded hover:bg-red-100 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// "use client";
// import React, { useState, useEffect } from "react";
// import { ChevronDownIcon, ChevronUpIcon } from "./Icons";

// interface ClaimItemProps {
//   title: string;
//   // status: "Approved" | "Declined" | "In Progress";
//   status: string;
//   information?: string;
//   policyId: string;
//   onCancel?: () => void;
// }

// export const ClaimItem: React.FC<ClaimItemProps> = ({
//   title,
//   status,
//   information,
//   policyId,
//   onCancel,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [moderators, setModerators] = useState<string[]>([]);
//   const [description, setDescription] = useState<string | null>(null);

//   const statusColor = {
//     Approved: "text-green-600",
//     Declined: "text-red-500",
//     "In Progress": "text-yellow-500",
//   };

//   // Fetch the moderators for approved or declined claims
//   useEffect(() => {
//     const fetchModerators = async () => {
//       if (status === "Approved" || status === "Declined") {
//         try {
//           const response = await mockFetchModerators(policyId);
//           setModerators(response);
//         } catch (error) {
//           console.error("Failed to fetch moderators:", error);
//         }
//       }
//     };

//     fetchModerators();
//   }, [status, policyId]);

//   // Fetch the claim description
//   useEffect(() => {
//     const fetchDescription = async () => {
//       try {
//         const response = await mockFetchDescription(policyId);
//         setDescription(response);
//       } catch (error) {
//         console.error("Failed to fetch claim description:", error);
//       }
//     };

//     fetchDescription();
//   }, [policyId]);

//   // Mock backend call to fetch moderator wallet addresses
//   const mockFetchModerators = async (policyId: string): Promise<string[]> => {
//     console.log(`Fetching moderators for policy ID: ${policyId}`);
//     // Simulated moderator addresses
//     return [
//       "0xModerator1WalletAddress",
//       "0xModerator2WalletAddress",
//       "0xModerator3WalletAddress",
//     ];
//   };

//   const mockFetchDescription = async (policyId: string): Promise<string> => {
//     console.log(`Fetching description for policy ID: ${policyId}`);
//     return information || "No description available.";
//   };

//   return (
//     <div className="w-full border border-zinc-300 rounded-lg bg-white shadow-sm">
//       <div className="w-full p-4">
//         {/* Grid Layout */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 items-start">
//           {/* Left: Title + Policy ID + Moderators */}
//           <div className="mb-2 sm:mb-0">
//             <h3 className="text-lg font-medium text-stone-900 break-words">
//               {title}
//             </h3>
//             <p className="text-sm text-gray-500">Policy ID: {policyId}</p>

//             {(status === "Approved" || status === "Declined") && moderators.length > 0 && (
//               <div className="text-sm text-gray-500 mt-1">
//                 {status === "Approved" ? "Approved by:" : "Declined by:"}
//                 <ul className="list-disc pl-4 text-gray-900 font-medium">
//                   {moderators.map((mod, idx) => (
//                     <li key={idx}>{mod}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>

//           {/* Right: Status + Expand */}
//           <div className="flex items-start sm:justify-end gap-3 mt-2 sm:mt-0">
//             {/* <span className={`text-sm font-semibold ${statusColor[status]}`}> */}
//             <span className={`text-sm font-semibold "text-green-600"`}>
//               {status}
//             </span>
//             <button
//               onClick={() => setIsOpen(!isOpen)}
//               aria-expanded={isOpen}
//               aria-controls={`claim-info-${policyId}`}
//             >
//               {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
//             </button>
//           </div>
//         </div>

//         {/* Description Panel */}
//         {isOpen && (
//           <div
//             id={`claim-info-${policyId}`}
//             className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap"
//           >
//             {description || "Loading description..."}
//           </div>
//         )}

//         {/* Cancel Button */}
//         {status === "In Progress" && (
//           <div className="mt-4 text-right">
//             <button
//               onClick={onCancel}
//               className="text-sm px-4 py-1.5 border border-red-500 text-red-500 rounded hover:bg-red-100 transition"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

