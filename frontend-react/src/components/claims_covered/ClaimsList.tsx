"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext
import { ClaimItem } from "./ClaimItem";

type ClaimStatus = "Approved" | "Declined" | "In Progress";

interface Claim {
  id: string;
  title: string;
  information?: string;
  status: ClaimStatus;
}

export const ClaimsList: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function getClaims() public view returns (tuple(string id, string title, string information, string status)[])",
  ];

  const fetchClaims = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet to view claims.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Fetch claims from the smart contract
      const claimsData = await contract.getClaims();
      const formattedClaims: Claim[] = claimsData.map((claim: any) => ({
        id: claim.id,
        title: claim.title,
        information: claim.information,
        status: claim.status as ClaimStatus,
      }));

      setClaims(formattedClaims);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchClaims();
    }
  }, [walletAddress]);

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
      <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading claims...</p>
        ) : claims.length > 0 ? (
          claims.map((claim) => (
            <ClaimItem
              key={claim.id}
              title={claim.title}
              status={claim.status}
              information={claim.information}
            />
          ))
        ) : (
          <p className="text-center text-lg font-medium">
            No claims found. Submit a claim to get started.
          </p>
        )}
      </section>
    </main>
  );
};

// "use client";
// import React from "react";
// import { ClaimItem } from "./ClaimItem";

// type ClaimStatus = "Approved" | "Declined" | "In Progress";

// interface Claim {
//   id: string;
//   title: string;
//   information?: string;
//   status: ClaimStatus;
// }

// const claims: Claim[] = [
//   {
//     id: "1",
//     title: "Cover ID: 34-A",
//     information: "Damage due to wildfire. Initial payout pending.",
//     status: "In Progress",
//   },
//   {
//     id: "2",
//     title: "Cover ID: 87-K",
//     information: "Claim declined due to lack of coverage documentation.",
//     status: "Declined",
//   },
//   {
//     id: "3",
//     title: "Cover ID: 11-P",
//     information: "Approved for 2.5 ETH payout. Awaiting final transfer.",
//     status: "Approved",
//   },
//   {
//     id: "4",
//     title: "Cover ID: 92-Z",
//     information: "Under review by claims team.",
//     status: "In Progress",
//   },
//   {
//     id: "5",
//     title: "Cover ID: 73-T",
//     information: "Approved. Finalized on-chain.",
//     status: "Approved",
//   },
// ];

// export const ClaimsList: React.FC = () => {
//   return (
//     <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
//       <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
//         {claims.map((claim) => (
//           <ClaimItem
//             key={claim.id}
//             title={claim.title}
//             status={claim.status}
//             information={claim.information}
//           />
//         ))}
//       </section>
//     </main>
//   );
// };



// "use client";
// import { useState } from "react";
// import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

// interface Claim {
//   id: string;
//   title: string;
//   information?: string;
// }

// export const ClaimsList = () => {
//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   const claims: Claim[] = [
//     { id: "1", title: "{Cover ID}", information: "{information about cover}" },
//     { id: "2", title: "Title" },
//     { id: "3", title: "Title" },
//     { id: "4", title: "Title" },
//     { id: "5", title: "Title" },
//   ];

//   return (
//     <div className="w-full min-h-screen bg-gray-50 flex justify-center py-4">
//       <section className="flex flex-col gap-4 w-full max-w-screen-sm max-sm:px-4 max-sm:py-0">
//         {claims.map((claim) => (
//           <article
//             key={claim.id}
//             className="p-4 bg-white rounded-lg border border-solid border-[#e5e7eb]"
//           >
//             <div className="flex justify-between items-center w-full">
//               <h3 className="text-base font-bold text-stone-900">
//                 {claim.title}
//               </h3>
//               <button
//                 onClick={() =>
//                   setExpandedId(expandedId === claim.id ? null : claim.id)
//                 }
//                 aria-expanded={expandedId === claim.id}
//                 aria-controls={`claim-content-${claim.id}`}
//               >
//                 {expandedId === claim.id ? (
//                   <ChevronUpIcon />
//                 ) : (
//                   <ChevronDownIcon />
//                 )}
//               </button>
//             </div>
//             {expandedId === claim.id && claim.information && (
//               <p
//                 id={`claim-content-${claim.id}`}
//                 className="mt-2 text-base text-stone-900"
//               >
//                 {claim.information}
//               </p>
//             )}
//           </article>
//         ))}
//       </section>
//     </div>
//   );
// };