"use client";
import * as React from "react";

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div className="mb-6">
      <label className="mb-2 text-base text-stone-900 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value"
        className="w-full px-4 py-3 text-base rounded-lg border border-solid border-neutral-200 text-zinc-400 focus:outline-none focus:border-stone-900"
      />
    </div>
  );
};
