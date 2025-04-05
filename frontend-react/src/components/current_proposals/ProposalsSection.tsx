"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ProposalItem } from "./ProposalItem";
import { useWallet } from "../../context/WalletContext";

type ProposalStatus = "Approved" | "Declined" | "In Progress" | "Approved and Executed";

interface Proposal {
  id: number;
  title: string;
  status: ProposalStatus;
  startDate: number;
  endDate: number;
}

export const ProposalsSection: React.FC = () => {
  const { walletAddress } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [delegateInput, setDelegateInput] = useState<string>("");
  const [hasDelegated, setHasDelegated] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

  const contractAddress = "0xYourContractAddress"; // Replace with actual address
  const contractABI = [
    "function getProposals() public view returns (tuple(uint id, string title, string status, uint startDate, uint endDate)[])",
    "function delegate(address delegateAddress) public",
    "function undelegate() public",
    "function hasDelegate(address user) public view returns (bool)",
    "function vote(uint proposalId, bool approve) public"
  ];

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // AJ: a method getting all proposals
      // Fetch proposals from the smart contract
      const proposalsData = await contract.getProposals();
      const formatted: Proposal[] = proposalsData.map((p: any) => ({
        id: Number(p.id),
        title: p.title,
        status: p.status as ProposalStatus,
        startDate: Number(p.startDate),
        endDate: Number(p.endDate),
      }));

      const sortOrder: ProposalStatus[] = ["In Progress", "Approved", "Declined", "Approved and Executed"];
      formatted.sort((a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status));

      setProposals(formatted);
    } catch (err) {
      console.error("Fetch proposals failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkDelegation = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const result = await contract.hasDelegate(walletAddress);
      setHasDelegated(result);
    } catch (err) {
      console.error("Delegation check failed:", err);
    }
  };

  const handleDelegate = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.delegate(delegateInput);
      await tx.wait();

      alert("Delegation successful.");
      setDelegateInput("");
      checkDelegation();
    } catch (err) {
      console.error("Delegation failed:", err);
      alert("Delegation failed. See console.");
    }
  };

  const handleUndelegate = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.undelegate();
      await tx.wait();

      alert("Undelegated successfully.");
      checkDelegation();
    } catch (err) {
      console.error("Undelegation failed:", err);
    }
  };

  const openVoteModal = (proposalId: number) => {
    if (!hasDelegated) {
      alert("You must delegate your voting power before voting.");
      return;
    }
    setSelectedProposalId(proposalId);
    setModalOpen(true);
  };

  const submitVote = async (proposalId: number, approve: boolean) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.vote(proposalId, approve);
      await tx.wait();

      alert(`Voted ${approve ? "Approve" : "Decline"} on Proposal #${proposalId}`);
      setModalOpen(false);
    } catch (err) {
      console.error("Vote failed:", err);
      alert("Vote failed. See console.");
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchProposals();
      checkDelegation();
    }
  }, [walletAddress]);

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
      <h1 className="mb-10 text-6xl font-bold text-center text-neutral-950 max-md:text-4xl">
        Current Proposals
      </h1>

      {/* Delegation Controls */}
      <div className="flex flex-col items-center mb-10">
        <label className="mb-2 font-medium text-lg text-black">Delegate Voting Power:</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={delegateInput}
            onChange={(e) => setDelegateInput(e.target.value)}
            placeholder="Enter delegate wallet address"
            className="p-2 border border-gray-300 rounded w-72"
          />
          <button
            onClick={handleDelegate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit Delegation
          </button>
          {hasDelegated && (
            <button
              onClick={handleUndelegate}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Undo Delegation
            </button>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4 p-8 mx-auto max-w-screen-sm">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading proposals...</p>
        ) : proposals.length > 0 ? (
          proposals.map((proposal) => {
            const now = Date.now();
            const isInProgress = proposal.status === "In Progress";
            const beforeEnd = now < proposal.endDate * 1000;
            const canVote = isInProgress && beforeEnd && hasDelegated;

            return (
              <div key={proposal.id} className="border p-4 rounded-md shadow bg-white">
                <ProposalItem title={proposal.title} status={proposal.status}>
                  <p className="text-sm text-gray-600">Proposal ID: {proposal.id}</p>
                  <p className="text-sm text-gray-600">
                    Start: {new Date(proposal.startDate * 1000).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    End: {new Date(proposal.endDate * 1000).toLocaleString()}
                  </p>

                  <button
                    onClick={() => openVoteModal(proposal.id)}
                    disabled={!canVote}
                    className={`mt-3 px-4 py-2 rounded text-white ${
                      canVote ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Vote
                  </button>
                </ProposalItem>
              </div>
            );
          })
        ) : (
          <p className="text-center text-lg font-medium">
            No proposals found. Please check back later.
          </p>
        )}
      </section>

      {/* Vote Modal */}
      {modalOpen && selectedProposalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Vote on Proposal #{selectedProposalId}
            </h2>
            <p className="text-gray-600 mb-6">Would you like to approve or decline this proposal?</p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => submitVote(selectedProposalId, true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => submitVote(selectedProposalId, false)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Decline
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// "use client";
// import React, { useEffect, useState } from "react";
// import { ethers } from "ethers";
// import { ProposalItem } from "./ProposalItem";
// import { useWallet } from "../../context/WalletContext"; // Import WalletContext

// // Define the allowed statuses
// type ProposalStatus = "Approved" | "Declined" | "In Progress" | "Approved and Executed";

// interface Proposal {
//   id: number;
//   title: string;
//   status: ProposalStatus;
//   startDate: number; // UNIX timestamp in seconds
//   endDate: number;   // UNIX timestamp in seconds
// }

// // interface Proposal {
// //   title: string;
// //   status: ProposalStatus;
// // }

// export const ProposalsSection: React.FC = () => {
//   const { walletAddress } = useWallet(); // Access wallet state from context
//   const [proposals, setProposals] = useState<Proposal[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   const contractAddress = "0xYourContractAddress"; // Replace with your contract address
//   const contractABI = [
//     "function getProposals() public view returns (tuple(uint id, string title, string status, uint startDate, uint endDate)[])",
//     "function delegateToProposal(uint proposalId) public",
//   ];

//   // const contractABI = [
//   //   "function getProposals() public view returns (tuple(string title, string status)[])",
//   // ];

//   const fetchProposals = async () => {
//     if (!walletAddress) {
//       alert("Please connect your wallet to view proposals.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const provider = new ethers.providers.Web3Provider(
//         window.ethereum as ethers.providers.ExternalProvider
//       );
//       const signer = provider.getSigner();
//       const contract = new ethers.Contract(contractAddress, contractABI, signer);

//       // Fetch proposals from the smart contract
//       const proposalsData = await contract.getProposals();
//       const formattedProposals: Proposal[] = proposalsData.map((proposal: any) => ({
//         id: Number(proposal.id),
//         title: proposal.title,
//         status: proposal.status as ProposalStatus,
//         startDate: Number(proposal.startDate),
//         endDate: Number(proposal.endDate),
//       }));

//       const sortOrder: ProposalStatus[] = ["In Progress", "Approved", "Declined", "Approved and Executed"];
//       formattedProposals.sort(
//         (a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status)
//       );

//       setProposals(formattedProposals);
//     } catch (error) {
//       console.error("Failed to fetch proposals:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (walletAddress) {
//       fetchProposals();
//     }
//   }, [walletAddress]);

//   const handleDelegate = async (proposalId: number) => {
//     try {
//       const provider = new ethers.providers.Web3Provider(window.ethereum as any);
//       const signer = provider.getSigner();
//       const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
//       const tx = await contract.delegateToProposal(proposalId);
//       await tx.wait();
//       alert("Delegation successful!");
//     } catch (error) {
//       console.error("Delegation failed:", error);
//       alert("Delegation failed. See console.");
//     }
//   };
  

//   return (
//     <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
//       <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
//         Current Proposals
//       </h1>

//       <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
//         {loading ? (
//           <p className="text-center text-lg font-medium">Loading proposals...</p>
//         ) : proposals.length > 0 ? (
//           proposals.map((proposal) => {
//             const now = Date.now();
//             const isInProgress = proposal.status === "In Progress";
//             const beforeEnd = now < proposal.endDate * 1000; // Convert to ms
//             const canDelegate = isInProgress && beforeEnd;
          
//             return (
//               <div key={proposal.id} className="border p-4 rounded-md shadow">
//                 <ProposalItem title={proposal.title} status={proposal.status} />
//                 <p className="text-sm text-gray-600">Proposal ID: {proposal.id}</p>
//                 <p className="text-sm text-gray-600">
//                   Start: {new Date(proposal.startDate * 1000).toLocaleString()}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   End: {new Date(proposal.endDate * 1000).toLocaleString()}
//                 </p>
          
//                 {canDelegate ? (
//                   <button
//                     onClick={() => handleDelegate(proposal.id)}
//                     className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Delegate DAO
//                   </button>
//                 ) : (
//                   <p className="text-sm text-gray-500 mt-2">Delegation not available.</p>
//                 )}
//               </div>
//             );
//           })
          
//         ) : (
//           <p className="text-center text-lg font-medium">
//             No proposals found. Please check back later.
//           </p>
//         )}
//       </section>
//     </main>
//   );
// };

// // "use client";
// // import React from "react";
// // import { ProposalItem } from "./ProposalItem";

// // // Define the allowed statuses
// // type ProposalStatus = "Approved" | "Declined" | "In Progress";

// // // Type the array items properly
// // const proposalItems: { title: string; status: ProposalStatus }[] = [
// //   { title: "Proposal to Reduce Premiums", status: "Approved" },
// //   { title: "Proposal for New Risk Pool", status: "In Progress" },
// //   { title: "Proposal to Increase Coverage Limits", status: "Declined" },
// //   { title: "Proposal for Emergency Fund Allocation", status: "Approved" },
// //   { title: "Proposal to Partner with GraviTrust", status: "In Progress" },
// // ];

// // export const ProposalsSection: React.FC = () => {
// //   return (
// //     <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
// //       <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
// //         Current Proposals
// //       </h1>

// //       <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
// //         {proposalItems.map((item, index) => (
// //           <ProposalItem key={index} title={item.title} status={item.status} />
// //         ))}
// //       </section>
// //     </main>
// //   );
// // };
