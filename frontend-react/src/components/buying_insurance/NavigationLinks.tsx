import React from "react";

const navigationItems = [
  "Claims",
  "Dashboard",
  "Buy Insurance",
  "Donate",
  "Governance",
];

export const NavigationLinks: React.FC = () => {
  return (
    <nav className="flex flex-1 gap-2 justify-end max-md:order-2 max-md:justify-center max-md:mt-4 max-md:w-full max-sm:hidden">
      {navigationItems.map((item) => (
        <button
          key={item}
          className="p-2 text-base rounded-lg text-stone-900 hover:bg-gray-100 transition-colors"
        >
          {item}
        </button>
      ))}
    </nav>
  );
};
