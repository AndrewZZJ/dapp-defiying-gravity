"use client";
import * as React from "react";
import { Header } from "./Header";
import { ClaimsHeader } from "./ClaimsHeader";
import { ClaimForm } from "./ClaimForm";

const Claims: React.FC = () => {
  return (
    <main className="w-full min-h-screen bg-neutral-100">
      <Header />
      <div className="flex flex-col items-center p-6">
        <ClaimsHeader />
        <ClaimForm />
      </div>
    </main>
  );
};

export default Claims;
