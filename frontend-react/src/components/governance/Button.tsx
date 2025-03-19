import * as React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: string;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon,
  onClick,
  className = "",
}) => {
  const baseStyles =
    "flex overflow-hidden gap-2 justify-center items-center self-stretch p-3 text-base leading-none";
  const variantStyles = {
    primary:
      "bg-zinc-800 text-neutral-100 rounded-lg border border-solid border-zinc-800",
    secondary:
      "bg-white text-zinc-800 rounded-lg border-solid border-[3px] border-zinc-800",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {icon && (
        <img
          src={icon}
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
          alt=""
        />
      )}
      <span className="self-stretch my-auto">{children}</span>
    </button>
  );
};
