"use client";
import * as React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string; // Ensure each input has a unique name for accessibility
}

export const FormInput: React.FC<FormInputProps> = ({ label, name, ...props }) => {
  return (
    <div className="w-full flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-stone-900">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="px-4 py-3 mt-1 w-full bg-white rounded-lg border border-solid border-zinc-300 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
};


// "use client";
// import * as React from "react";

// interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
//   label: string;
// }

// export const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => {
//   return (
//     <div className="w-full">
//       <label className="leading-snug text-stone-900">{label}</label>
//       <input
//         className="overflow-hidden flex-1 shrink self-stretch px-4 py-3 mt-2 w-full leading-none bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 text-zinc-800"
//         {...props}
//       />
//     </div>
//   );
// };
