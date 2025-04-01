"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ProposalItem } from "./ProposalItem";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

// Define the allowed statuses
type ProposalStatus = "Approved" | "Declined" | "In Progress" | "Approved and Executed";

interface Proposal {
  id: number;
  title: string;
  status: ProposalStatus;
  startDate: number; // UNIX timestamp in seconds
  endDate: number;   // UNIX timestamp in seconds
}

// interface Proposal {
//   title: string;
//   status: ProposalStatus;
// }

export const ProposalsSection: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function getProposals() public view returns (tuple(uint id, string title, string status, uint startDate, uint endDate)[])",
    "function delegateToProposal(uint proposalId) public",
  ];

  // const contractABI = [
  //   "function getProposals() public view returns (tuple(string title, string status)[])",
  // ];

  const fetchProposals = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet to view proposals.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // AJ: a method getting all proposals
      // Fetch proposals from the smart contract
      const proposalsData = await contract.getProposals();
      const formattedProposals: Proposal[] = proposalsData.map((proposal: any) => ({
        id: Number(proposal.id),
        title: proposal.title,
        status: proposal.status as ProposalStatus,
        startDate: Number(proposal.startDate),
        endDate: Number(proposal.endDate),
      }));

      const sortOrder: ProposalStatus[] = ["In Progress", "Approved", "Declined", "Approved and Executed"];
      formattedProposals.sort(
        (a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status)
      );

      setProposals(formattedProposals);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchProposals();
    }
  }, [walletAddress]);

  const handleDelegate = async (proposalId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      const tx = await contract.delegateToProposal(proposalId);
      await tx.wait();
      alert("Delegation successful!");
    } catch (error) {
      console.error("Delegation failed:", error);
      alert("Delegation failed. See console.");
    }
  };
  

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Current Proposals
      </h1>

      <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading proposals...</p>
        ) : proposals.length > 0 ? (
          proposals.map((proposal) => {
            const now = Date.now();
            const isInProgress = proposal.status === "In Progress";
            const beforeEnd = now < proposal.endDate * 1000; // Convert to ms
            const canDelegate = isInProgress && beforeEnd;
          
            return (
              <div key={proposal.id} className="border p-4 rounded-md shadow">
                <ProposalItem title={proposal.title} status={proposal.status} />
                <p className="text-sm text-gray-600">Proposal ID: {proposal.id}</p>
                <p className="text-sm text-gray-600">
                  Start: {new Date(proposal.startDate * 1000).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  End: {new Date(proposal.endDate * 1000).toLocaleString()}
                </p>
          
                {canDelegate ? (
                  <button
                    onClick={() => handleDelegate(proposal.id)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Delegate DAO
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Delegation not available.</p>
                )}
              </div>
            );
          })
          
        ) : (
          <p className="text-center text-lg font-medium">
            No proposals found. Please check back later.
          </p>
        )}
      </section>
    </main>
  );
};

// "use client";
// import React from "react";
// import { ProposalItem } from "./ProposalItem";

// // Define the allowed statuses
// type ProposalStatus = "Approved" | "Declined" | "In Progress";

// // Type the array items properly
// const proposalItems: { title: string; status: ProposalStatus }[] = [
//   { title: "Proposal to Reduce Premiums", status: "Approved" },
//   { title: "Proposal for New Risk Pool", status: "In Progress" },
//   { title: "Proposal to Increase Coverage Limits", status: "Declined" },
//   { title: "Proposal for Emergency Fund Allocation", status: "Approved" },
//   { title: "Proposal to Partner with GraviTrust", status: "In Progress" },
// ];

// export const ProposalsSection: React.FC = () => {
//   return (
//     <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
//       <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
//         Current Proposals
//       </h1>

//       <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
//         {proposalItems.map((item, index) => (
//           <ProposalItem key={index} title={item.title} status={item.status} />
//         ))}
//       </section>
//     </main>
//   );
// };
