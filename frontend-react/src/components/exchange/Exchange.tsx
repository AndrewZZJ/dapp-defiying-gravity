"use client";

import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { SwapForm } from "./SwapForm";

const Exchange = () => {
  return (
    <main className="overflow-hidden bg-zinc-800 min-h-screen">
      <NavigationHeader />

      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-40 w-full min-h-[782px] max-md:px-4">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1616a3702a56422d49c62b0640e3906f852114ab?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Background"
          className="object-cover absolute inset-0 size-full"
        />

        <h1 className="relative text-7xl font-bold tracking-tighter leading-tight text-center text-neutral-950 max-md:text-4xl mb-10">
          Token Exchange
        </h1>

        <div className="relative w-full max-w-2xl z-10">
          <SwapForm />
        </div>
      </section>
    </main>
  );
};

export default Exchange;
