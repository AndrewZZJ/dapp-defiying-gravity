"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ProposalItem } from "./ProposalItem";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

// Define the allowed statuses
type ProposalStatus = "Approved" | "Declined" | "In Progress";

interface Proposal {
  title: string;
  status: ProposalStatus;
}

export const ProposalsSection: React.FC = () => {
  const { walletAddress } = useWallet(); // Access wallet state from context
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function getProposals() public view returns (tuple(string title, string status)[])",
  ];

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

      // Fetch proposals from the smart contract
      const proposalsData = await contract.getProposals();
      const formattedProposals: Proposal[] = proposalsData.map((proposal: any) => ({
        title: proposal.title,
        status: proposal.status as ProposalStatus,
      }));

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

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Current Proposals
      </h1>

      <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading proposals...</p>
        ) : proposals.length > 0 ? (
          proposals.map((proposal, index) => (
            <ProposalItem key={index} title={proposal.title} status={proposal.status} />
          ))
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
