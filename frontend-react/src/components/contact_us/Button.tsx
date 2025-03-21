"use client";
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "overflow-hidden gap-2 p-3 text-base leading-none rounded-lg border border-solid";
  const variantStyles = {
    primary: "bg-zinc-800 border-zinc-800 text-neutral-100",
    secondary: "bg-white border-zinc-300 text-stone-900",
  };
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};