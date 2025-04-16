"use client";

import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { DonationForm } from "./DonationForm";

function Donate() {
  return (
    <main className="overflow-hidden bg-zinc-800">
      <NavigationHeader />

      <section className="flex relative flex-col items-center px-6 pt-12 pb-20 w-full bg-gradient-to-b from-gray-50 to-gray-100">
        {/* <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1616a3702a56422d49c62b0640e3906f852114ab?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        /> */}

        {/* <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8"> */}
        <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800">
            Donate
        </h1>

        <div className="w-full max-w-7xl">
            <DonationForm />
        </div>
        </section>
    </main>
  );
}

export default Donate;