"use client";
import * as React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { PoolsSection } from "./PoolsSection";

export const InsurancePortal: React.FC = () => {
  return (
    <div className="flex flex-col bg-neutral-100 min-h-[screen]">
      <NavigationHeader />
      <PoolsSection />
    </div>
  );
};

export default InsurancePortal;
