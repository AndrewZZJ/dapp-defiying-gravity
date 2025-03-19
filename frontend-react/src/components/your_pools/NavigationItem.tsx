"use client";
import * as React from "react";

interface NavigationItemProps {
  label: string;
  isActive?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  label,
  isActive = false,
}) => {
  return (
    <button
      className={`gap-2 p-2 text-base rounded-lg text-stone-900 ${
        isActive ? "bg-neutral-100" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </button>
  );
};
