"use client";
import * as React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { ProposalForm } from "./ProposalForm";

function Governance() {
  return (
    <main className="overflow-hidden bg-zinc-800">
      <NavigationHeader />
      <section className="flex relative flex-col items-center px-20 pt-12 pb-40 w-full min-h-[782px] max-md:px-5 max-md:pb-24 max-md:max-w-full">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1616a3702a56422d49c62b0640e3906f852114ab?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Background"
          className="object-cover absolute inset-0 size-full"
        />
        <div className="flex relative flex-col mb-0 max-w-full w-[572px] max-md:mb-2.5">
          <h1 className="text-7xl font-bold tracking-tighter leading-tight text-center text-neutral-950 max-md:max-w-full max-md:text-4xl">
            Have a Proposal?
          </h1>
          <ProposalForm />
        </div>
      </section>
    </main>
  );
}

export default Governance;
