"use client";

import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { SwapForm } from "./SwapForm";

const Exchange = () => {
  return (
    <main className="overflow-hidden bg-zinc-800">
      <NavigationHeader />

      <section className="flex relative flex-col items-center px-6 pt-12 pb-20 w-full bg-gradient-to-b from-gray-50 to-gray-100">
        <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
          Token Exchange
        </h1>

        <div className="w-full max-w-7xl">
          <SwapForm />
        </div>
      </section>
    </main>
  );
};

export default Exchange;