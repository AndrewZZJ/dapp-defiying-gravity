"use client";
import React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { ProposalsSection } from "./ProposalsSection";
import { ModeratorNominations } from "./ModeratorNominations";

export const CurrentProposals: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[color:var(--sds-color-background-brand-default)]">
      <NavigationHeader />
      <ProposalsSection />
      <ModeratorNominations /> 
    </div>
  );
};

export default CurrentProposals;
