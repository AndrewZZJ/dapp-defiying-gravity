"use client";
import React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { ClaimsContent } from "./ClaimsContent";

const PendingOracle: React.FC = () => {
  return (
    <div className="overflow-hidden bg-zinc-800">
      <NavigationHeader />
      <ClaimsContent />
    </div>
  );
};

export default PendingOracle;
