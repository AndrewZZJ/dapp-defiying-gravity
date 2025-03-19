"use client";
import { DollarIcon } from "./Icons";

export const Header = () => {
  return (
    <header className="flex gap-6 items-center p-8 bg-white border-b border-solid border-b-[#e5e7eb] max-md:flex-wrap max-md:p-6 max-sm:p-4">
      <div className="flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e4180d6a8c78953ba48dff39ab7baf51200fa34a"
          className="object-contain w-10 h-[35px]"
          alt="Logo"
        />
      </div>
      <nav className="flex flex-1 gap-2 justify-end max-md:overflow-x-auto max-md:order-2 max-md:justify-start max-md:w-full">
        {["Claims", "Dashboard", "Buy Insurance", "Donate", "Governance"].map(
          (item) => (
            <button
              key={item}
              className="p-2 text-base rounded-lg cursor-pointer text-stone-900 hover:bg-gray-100"
            >
              {item}
            </button>
          )
        )}
      </nav>
      <button className="flex gap-2 items-center p-3 text-base bg-white rounded-lg border-solid cursor-pointer border-[3px] border-[#e5e7eb] text-zinc-800 max-md:order-1 hover:bg-gray-50">
        <DollarIcon />
        <span>Connect your wallet</span>
      </button>
    </header>
  );
};
