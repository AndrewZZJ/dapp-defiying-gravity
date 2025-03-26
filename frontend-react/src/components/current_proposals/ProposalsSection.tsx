"use client";
import React from "react";
import { ProposalItem } from "./ProposalItem";

// Define the allowed statuses
type ProposalStatus = "Approved" | "Declined" | "In Progress";

// Type the array items properly
const proposalItems: { title: string; status: ProposalStatus }[] = [
  { title: "Proposal to Reduce Premiums", status: "Approved" },
  { title: "Proposal for New Risk Pool", status: "In Progress" },
  { title: "Proposal to Increase Coverage Limits", status: "Declined" },
  { title: "Proposal for Emergency Fund Allocation", status: "Approved" },
  { title: "Proposal to Partner with GraviTrust", status: "In Progress" },
];

export const ProposalsSection: React.FC = () => {
  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] min-h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Current Proposals
      </h1>

      <section className="flex flex-col gap-4 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {proposalItems.map((item, index) => (
          <ProposalItem key={index} title={item.title} status={item.status} />
        ))}
      </section>
    </main>
  );
};
