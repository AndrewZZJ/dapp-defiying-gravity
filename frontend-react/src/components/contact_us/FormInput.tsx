"use client";
import * as React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => {
  return (
    <div className="w-full">
      <label className="leading-snug text-stone-900">{label}</label>
      <input
        className="overflow-hidden flex-1 shrink self-stretch px-4 py-3 mt-2 w-full leading-none bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 text-zinc-800"
        {...props}
      />
    </div>
  );
};
