"use client";

import * as React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}) => {
  const baseStyles =
    "overflow-hidden gap-2 p-3 text-base leading-none rounded-lg";
  const variantStyles = {
    primary: "bg-stone-900 border border-zinc-800 text-neutral-100",
    secondary: "bg-neutral-200 border border-neutral-500",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
