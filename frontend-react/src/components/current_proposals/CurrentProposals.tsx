"use client";
import React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { ProposalsSection } from "./ProposalsSection";

export const CurrentProposals: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[color:var(--sds-color-background-brand-default)]">
      <NavigationHeader />
      <ProposalsSection />
    </div>
  );
};

export default CurrentProposals;
