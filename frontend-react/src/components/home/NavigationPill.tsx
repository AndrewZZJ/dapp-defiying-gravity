import * as React from "react";

interface NavigationPillProps {
  children: React.ReactNode;
  active?: boolean;
}

export const NavigationPill: React.FC<NavigationPillProps> = ({
  children,
  active = false,
}) => {
  return (
    <button
      className={`gap-2 self-stretch p-2 rounded-lg ${
        active ? "bg-neutral-100" : ""
      }`}
    >
      {children}
    </button>
  );
};
