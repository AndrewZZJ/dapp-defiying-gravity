import React from "react";

const navigationItems = [
  { label: "Claims", isActive: true },
  { label: "Dashboard", isActive: false },
  { label: "Buy Insurance", isActive: false },
  { label: "Donate", isActive: false },
  { label: "Governance", isActive: false },
];

export const NavigationItems: React.FC = () => {
  return (
    <nav className="flex flex-wrap flex-1 gap-2 justify-end items-start max-sm:hidden">
      {navigationItems.map((item) => (
        <button
          key={item.label}
          className={`gap-2 p-2 text-base leading-4 rounded-lg text-stone-900 ${
            item.isActive ? "bg-gray-100" : ""
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};
