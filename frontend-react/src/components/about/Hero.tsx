"use client";

import * as React from "react";

export const Hero: React.FC = () => {
  return (
    <section className="relative flex flex-col justify-center items-center px-16 py-40 w-full text-7xl font-bold tracking-tighter leading-tight text-center min-h-[406px] text-stone-900 max-md:px-5 max-md:py-24 max-md:max-w-full max-md:text-4xl">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/c2e64fdb581651da4c62a14c1e8ec2f9701bee59?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
        alt="Team background"
        className="object-cover absolute inset-0 w-full h-full z-0"
      />
      <div className="relative z-10">
        <h1 className="max-w-full w-[884px] max-md:max-w-full max-md:text-4xl">
          Meet the GraviTrust Team!
        </h1>
      </div>
    </section>
  );
};