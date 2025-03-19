import React from "react";

export const ClaimsContent: React.FC = () => {
  return (
    <main className="flex relative flex-col items-center px-20 pt-6 pb-96 w-full leading-tight min-h-[782px] max-md:px-5 max-md:pb-24 max-md:max-w-full">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/1616a3702a56422d49c62b0640e3906f852114ab?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
        alt="Background"
        className="object-cover absolute inset-0 size-full"
      />
      <div className="flex relative flex-col mb-0 ml-7 max-w-full w-[466px] max-md:mb-2.5">
        <h1 className="self-center max-w-full text-7xl font-bold tracking-tighter text-center whitespace-nowrap text-neutral-950 w-[231px] max-md:text-4xl">
          Claims
        </h1>
        <section className="mt-[163px] p-8 max-w-[600px] rounded-lg shadow-md bg-white border border-solid border-[color:var(--sds-color-border-default-default)] max-md:px-5 max-md:mt-10 max-md:max-w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1e1e1e]">
            The Oracle Is Verifying Your Claim...
          </h2>
        </section>
      </div>
    </main>
  );
};
