"use client";
import React from "react";
import { Header } from "./Header";
import { ClaimsContent } from "./ClaimsContent";

const PendingOracle: React.FC = () => {
  return (
    <div className="overflow-hidden bg-zinc-800">
      <Header />
      <ClaimsContent />
    </div>
  );
};

export default PendingOracle;
