"use client";
import React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { PoolsSection } from "./PoolsSection";

export const BuyInsurance: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[color:var(--sds-color-background-brand-default)]">
      <NavigationHeader />
      <PoolsSection />
    </div>
  );
};

export default BuyInsurance;
