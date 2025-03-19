"use client";
import * as React from "react";

interface FormInputProps {
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder = "Value",
  type = "text",
  className = "",
}) => {
  const inputClassName =
    "px-4 py-3 w-full text-base rounded-lg border border-solid bg-[color:var(--sds-color-background-default-default)] border-[color:var(--sds-color-border-default-default)] text-zinc-400";

  return (
    <div className={`mb-6 ${className}`}>
      <label className="mb-2 text-base text-stone-900">{label}</label>
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          className={`${inputClassName} resize-y min-h-20`}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
    </div>
  );
};
