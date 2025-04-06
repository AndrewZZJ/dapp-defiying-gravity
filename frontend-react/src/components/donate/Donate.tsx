"use client";

import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { DonationForm } from "./DonationForm";

function Donate() {
  return (
    <main className="overflow-hidden bg-zinc-800">
      <NavigationHeader />

      <section className="flex relative flex-col items-start px-20 pt-20 pb-40 w-full min-h-[782px] max-md:px-5 max-md:pb-24 max-md:max-w-full">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1616a3702a56422d49c62b0640e3906f852114ab?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <h1 className="relative text-7xl font-bold tracking-tighter leading-tight text-center whitespace-nowrap text-neutral-950 max-md:text-4xl">
          Donate
        </h1>

        <div className="flex relative flex-wrap gap-10 mt-8 mb-0 w-full text-base max-w-[944px] max-md:mb-2.5 max-md:max-w-full">
          <DonationForm />
        </div>
      </section>
    </main>
  );
}

export default Donate;