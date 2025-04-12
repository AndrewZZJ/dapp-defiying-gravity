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
}

export const ClaimsList: React.FC = () => {
  const { walletAddress } = useWallet();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
      let allClaims: Claim[] = [];

      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;

        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

        try {
          const claimIds: ethers.BigNumber[] = await contract.fetchClaimIds(walletAddress);
          for (const id of claimIds) {
            const details = await contract.getClaimDetails(id);

            const claim: Claim = {
              id: details[0].toString(),
              policyId: details[1],
              eventId: details[2],
              approvedAmounts: details[11].map((amt: any) => ethers.utils.formatEther(amt)),
              status: details[6], // already string from contract
              description: details[7],
              moderators: details[8],
              hasDecided: details[9],
              isApproved: details[10],
            };

            allClaims.push(claim);
          }
        } catch (err) {
          console.warn(`Skipping ${type} — failed to fetch claims.`);
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
    if (walletAddress) {
      fetchClaims();
    }
  }, [walletAddress]);

  const handleCancel = (id: string) => {
    alert(`Canceling claim with ID: ${id}`);
  };

  const sortedClaims = [...claims].sort((a, b) => {
    if (a.status === "In Progress" && b.status !== "In Progress") return -1;
    if (a.status !== "In Progress" && b.status === "In Progress") return 1;
    return 0;
  });

  return (
    <main className="relative px-0 py-3.5 bg-gray-50 min-h-[782px]">
      <section className="flex flex-col gap-4 p-16 mx-auto max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading claims...</p>
        ) : sortedClaims.length === 0 ? (
          <p className="text-center text-lg font-medium">No claims found.</p>
        ) : (
          sortedClaims.map((claim) => (
            <ClaimItem
              key={claim.id}
              title={`Event: ${claim.eventId}`}
              status={claim.status}
              policyId={claim.policyId}
              information={claim.description}
              moderators={claim.moderators}
              hasDecided={claim.hasDecided}
              isApproved={claim.isApproved}
              approvedAmounts={claim.approvedAmounts}
              onCancel={claim.status === "In Progress" ? () => handleCancel(claim.id) : undefined}
            />
          ))
        )}
      </section>
    </main>
  );
};


// "use client";
// import React, { useEffect, useState } from "react";
// import { ethers } from "ethers";
// import { useWallet } from "../../context/WalletContext";
// import { ClaimItem } from "./ClaimItem";
// import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

// type ClaimStatus = "Approved" | "Declined" | "In Progress";
// const claimStatusMap = ["Pending", "Accepted", "Denied"];

// interface Claim {
//   id: string;
//   title: string;
//   policyId: string;
//   // status: ClaimStatus;
//   status: string;
// }

// //   struct ClaimRecord {
//     //     uint256 claimId; // Auto-incremented claim ID.
//     //     bytes32 policyId; // Associated policy.
//     //     string eventId; // Associated disaster event (string ID, e.g., "EVT#1").
//     //     uint256 approvedClaimAmount; // The final approved amount.
//     //     uint256 assessmentStart; // Timestamp when claim assessment starts.
//     //     uint256 assessmentEnd; // Timestamp when claim assessment ends.
//     //     ClaimStatus status; // Current claim status.
//     //     string incidentDescription; // Details about the incident.
//     //     ModeratorInfo[] moderatorTeam; // Array of moderator decisions
//     // }

// const useMockData = false;

// const mockClaims: Claim[] = [
//   {
//     id: "1",
//     title: "Cover ID: 34-A",
//     policyId: "POL-001",
//     status: "In Progress",
//   },
//   {
//     id: "2",
//     title: "Cover ID: 87-K",
//     policyId: "POL-002",
//     status: "Declined",
//   },
//   {
//     id: "3",
//     title: "Cover ID: 11-P",
//     policyId: "POL-003",
//     status: "Approved",
//   },
//   {
//     id: "4",
//     title: "Cover ID: 92-Z",
//     policyId: "POL-004",
//     status: "In Progress",
//   },
//   {
//     id: "5",
//     title: "Cover ID: 73-T",
//     policyId: "POL-005",
//     status: "Approved",
//   },
// ];

// export const ClaimsList: React.FC = () => {
//   const { walletAddress } = useWallet();
//   const [claims, setClaims] = useState<Claim[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   // const contractAddress = "0xYourContractAddress";
//   // const contractABI = [
//   //   "function getClaims() public view returns (tuple(string id, string title, string policyId, string status)[])",
//   // ];

// const fetchClaims = async () => {
//   try {
//     setLoading(true);

//     const res = await fetch("/addresses.json");
//     const addresses = await res.json();
//     const provider = new ethers.providers.Web3Provider(window.ethereum as any);
//     const signer = provider.getSigner();

//     const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
//     let allClaims: Claim[] = [];

//     for (const type of types) {
//       const contractAddress = addresses[type];
//       if (!contractAddress) continue;

//       const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

//       try {
//         const claimsData = await contract.getAllClaims();
//         const formattedClaims: Claim[] = claimsData[0].map((claimId: any, index: number) => ({
//           id: claimId.toString(),
//           title: `${type.replace("Insurance", "")} Claim`,
//           policyId: claimsData[1][index],
//           status: claimStatusMap[claimsData[5][index]],
//         }));

//         allClaims = allClaims.concat(formattedClaims);
//       } catch (err) {
//         console.warn(`Skipping ${type} — failed to fetch claims.`);
//       }
//     }

//     setClaims(allClaims);
//   } catch (error) {
//     console.error("Failed to fetch claims:", error);
//   } finally {
//     setLoading(false);
//   }
// };


//   useEffect(() => {
//     if (useMockData) {
//       setClaims(mockClaims);
//       setLoading(false);
//     } else if (walletAddress) {
//       fetchClaims();
//     }
//   }, [walletAddress]);

//   const handleCancel = (id: string) => {
//     alert(`Canceling claim with ID: ${id}`);
//     // In the future, hook this into smart contract call or backend cancel
//   };

//   // Sort claims so "In Progress" claims appear first
//   const sortedClaims = [...claims].sort((a, b) => {
//     if (a.status === "In Progress" && b.status !== "In Progress") return -1;
//     if (a.status !== "In Progress" && b.status === "In Progress") return 1;
//     return 0;
//   });

//   return (
//     <main className="relative px-0 py-3.5 bg-gray-50 min-h-[782px]">
//       <section className="flex flex-col gap-4 p-16 mx-auto max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
//         {loading ? (
//           <p className="text-center text-lg font-medium">Loading claims...</p>
//         ) : sortedClaims.length === 0 ? (
//           <p className="text-center text-lg font-medium">No claims found.</p>
//         ) : (
//           sortedClaims.map((claim) => (
//             <ClaimItem
//               key={claim.id}
//               title={claim.title}
//               // status={claim.status}
//               status={claim.status}
//               // status: claimStatusMap[claim.status.toNumber()],
//               policyId={claim.policyId} // Pass policyId to ClaimItem
//               onCancel={
//                 claim.status === "In Progress" ? () => handleCancel(claim.id) : undefined
//               } // Only allow canceling "In Progress" claims
//             />
//           ))
//         )}
//       </section>
//     </main>
//   );
// };
