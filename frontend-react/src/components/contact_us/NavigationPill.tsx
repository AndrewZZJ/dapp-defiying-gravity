import * as React from "react";

interface NavigationPillProps {
  label: string;
  isActive?: boolean;
}

export const NavigationPill: React.FC<NavigationPillProps> = ({
  label,
  isActive = false,
}) => {
  return (
    <button
      className={`gap-2 self-stretch p-2 rounded-lg ${
        isActive ? "bg-neutral-100" : ""
      } text-base leading-none whitespace-nowrap`}
    >
      {label}
    </button>
  );
};
