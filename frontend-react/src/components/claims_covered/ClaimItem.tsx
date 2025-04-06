"use client";
import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";

interface ClaimItemProps {
  title: string;
  status: "Approved" | "Declined" | "In Progress";
  information?: string;
  policyId: string;
  onCancel?: () => void;
}

export const ClaimItem: React.FC<ClaimItemProps> = ({
  title,
  status,
  information,
  policyId,
  onCancel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [moderators, setModerators] = useState<string[]>([]);
  const [description, setDescription] = useState<string | null>(null);

  const statusColor = {
    Approved: "text-green-600",
    Declined: "text-red-500",
    "In Progress": "text-yellow-500",
  };

  // Fetch the moderators for approved or declined claims
  useEffect(() => {
    const fetchModerators = async () => {
      if (status === "Approved" || status === "Declined") {
        try {
          const response = await mockFetchModerators(policyId);
          setModerators(response);
        } catch (error) {
          console.error("Failed to fetch moderators:", error);
        }
      }
    };

    fetchModerators();
  }, [status, policyId]);

  // Fetch the claim description
  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const response = await mockFetchDescription(policyId);
        setDescription(response);
      } catch (error) {
        console.error("Failed to fetch claim description:", error);
      }
    };

    fetchDescription();
  }, [policyId]);

  // Mock backend call to fetch moderator wallet addresses
  const mockFetchModerators = async (policyId: string): Promise<string[]> => {
    console.log(`Fetching moderators for policy ID: ${policyId}`);
    // Simulated moderator addresses
    return [
      "0xModerator1WalletAddress",
      "0xModerator2WalletAddress",
      "0xModerator3WalletAddress",
    ];
  };

  const mockFetchDescription = async (policyId: string): Promise<string> => {
    console.log(`Fetching description for policy ID: ${policyId}`);
    return information || "No description available.";
  };

  return (
    <div className="w-full border border-zinc-300 rounded-lg bg-white shadow-sm">
      <div className="w-full p-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 items-start">
          {/* Left: Title + Policy ID + Moderators */}
          <div className="mb-2 sm:mb-0">
            <h3 className="text-lg font-medium text-stone-900 break-words">
              {title}
            </h3>
            <p className="text-sm text-gray-500">Policy ID: {policyId}</p>

            {(status === "Approved" || status === "Declined") && moderators.length > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                {status === "Approved" ? "Approved by:" : "Declined by:"}
                <ul className="list-disc pl-4 text-gray-900 font-medium">
                  {moderators.map((mod, idx) => (
                    <li key={idx}>{mod}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Status + Expand */}
          <div className="flex items-start sm:justify-end gap-3 mt-2 sm:mt-0">
            <span className={`text-sm font-semibold ${statusColor[status]}`}>
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
            {description || "Loading description..."}
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
//   status: "Approved" | "Declined" | "In Progress";
//   information?: string; // This will now represent the user's claim description
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
//   const [moderator, setModerator] = useState<string | null>(null);
//   const [description, setDescription] = useState<string | null>(null); // State for claim description

//   const statusColor = {
//     Approved: "text-green-600",
//     Declined: "text-red-500",
//     "In Progress": "text-yellow-500",
//   };

//   // Fetch the moderator's wallet address for approved or declined claims
//   useEffect(() => {
//     const fetchModerator = async () => {
//       if (status === "Approved" || status === "Declined") {
//         try {
//           // Replace this with an actual backend call
//           const response = await mockFetchModerator(policyId);
//           setModerator(response);
//         } catch (error) {
//           console.error("Failed to fetch moderator:", error);
//         }
//       }
//     };

//     fetchModerator();
//   }, [status, policyId]);

//   // Fetch the claim description (simulated backend call)
//   useEffect(() => {
//     const fetchDescription = async () => {
//       try {
//         // Replace this with an actual backend call
//         const response = await mockFetchDescription(policyId);
//         setDescription(response);
//       } catch (error) {
//         console.error("Failed to fetch claim description:", error);
//       }
//     };

//     fetchDescription();
//   }, [policyId]);

//   // Mock backend call to fetch the moderator's wallet address
//   const mockFetchModerator = async (policyId: string): Promise<string> => {
//     console.log(`Fetching moderator for policy ID: ${policyId}`);
//     // Simulate a backend response
//     return "0xModeratorWalletAddress";
//   };

//   // Mock backend call to fetch the claim description
//   const mockFetchDescription = async (policyId: string): Promise<string> => {
//     console.log(`Fetching description for policy ID: ${policyId}`);
//     // Simulate a backend response
//     return information || "No description available.";
//   };

//   return (
//     <div className="w-full border border-zinc-300 rounded-lg bg-white shadow-sm">
//       <div className="w-full p-4">
//         {/* Grid Layout for Better Spacing */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 items-start">
//           {/* Left: Title + Policy ID */}
//           <div className="mb-2 sm:mb-0">
//             <h3 className="text-lg font-medium text-stone-900 break-words">
//               {title}
//             </h3>
//             <p className="text-sm text-gray-500">Policy ID: {policyId}</p>

//             {/* Approved/Declined By Field */}
//             {(status === "Approved" || status === "Declined") && moderator && (
//               <p className="text-sm text-gray-500">
//                 {status === "Approved" ? "Approved by:" : "Declined by:"}{" "}
//                 <span className="text-gray-900 font-medium">{moderator}</span>
//               </p>
//             )}
//           </div>

//           {/* Right: Status + Chevron */}
//           <div className="flex items-start sm:justify-end gap-3 mt-2 sm:mt-0">
//             <span className={`text-sm font-semibold ${statusColor[status]}`}>
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

//         {/* Expanded Info Section */}
//         {isOpen && (
//           <div
//             id={`claim-info-${policyId}`}
//             className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap"
//           >
//             {description || "Loading description..."}
//           </div>
//         )}

//         {/* Cancel Button - Only Render for "In Progress" Claims */}
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

