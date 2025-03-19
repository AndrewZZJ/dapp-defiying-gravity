"use client";
import * as React from "react";

interface NavigationItemProps {
  text: string;
  onClick?: () => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  text,
  onClick,
}) => {
  return (
    <button
      className="p-2 text-base rounded-lg cursor-pointer text-stone-900 hover:bg-neutral-100"
      onClick={onClick}
    >
      {text}
    </button>
  );
};
