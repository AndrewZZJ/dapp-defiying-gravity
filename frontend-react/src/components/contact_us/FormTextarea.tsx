"use client";
import * as React from "react";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  ...props
}) => {
  return (
    <div className="w-full leading-snug">
      <label className="text-stone-900">{label}</label>
      <div className="relative mt-2">
        <textarea
          className="flex overflow-hidden w-full px-4 py-3 bg-white rounded-lg border border-solid border-zinc-300 min-h-20 min-w-60 text-zinc-800 resize-none"
          {...props}
        />
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e7030f78278d7c5e1f552a2fc04e70b5790a8dfc?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          className="object-contain absolute bottom-1.5 z-0 shrink-0 aspect-square h-[7px] right-[5px] w-[7px]"
          alt=""
        />
      </div>
    </div>
  );
};
