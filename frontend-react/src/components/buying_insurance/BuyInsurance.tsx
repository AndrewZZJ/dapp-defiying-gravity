"use client";
import React from "react";
import { Header } from "./Header";
import { PoolsSection } from "./PoolsSection";

export const BuyInsurance: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[color:var(--sds-color-background-brand-default)]">
      <Header />
      <PoolsSection />
    </div>
  );
};

export default BuyInsurance;
