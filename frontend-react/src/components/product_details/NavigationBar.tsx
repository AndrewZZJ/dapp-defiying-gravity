import * as React from "react";

export function NavigationBar() {
  return (
    <header className="flex items-center p-6 bg-white border-b border-solid border-b-black border-b-opacity-10 max-sm:flex-wrap max-sm:gap-4 max-sm:p-4">
      <nav className="flex gap-6 items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3fb9b5d6a5bb2e6c792094834f99869333a63ef"
          className="w-10 h-[35px]"
          alt="Logo"
        />
      </nav>
      <nav className="flex flex-1 gap-2 justify-end max-sm:order-3 max-sm:justify-between max-sm:w-full">
        <button className="p-2 text-base rounded-lg text-stone-900">
          Products
        </button>
        <button className="p-2 text-base rounded-lg text-stone-900">
          About Us
        </button>
      </nav>
      <button className="p-3 ml-6 text-base rounded-lg bg-stone-900 text-neutral-100 w-[178px] max-sm:ml-auto max-sm:w-auto">
        Open App
      </button>
    </header>
  );
}
