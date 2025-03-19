"use client";
import * as React from "react";
import { FormInput } from "./FormInput";

export const CreatePoolForm: React.FC = () => {
  return (
    <main className="relative p-6 bg-[color:var(--sds-color-background-default-secondary)]">
      <button className="absolute cursor-pointer left-[47px] top-[33px] max-sm:top-4 max-sm:left-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M38 24H10M10 24L24 38M10 24L24 10"
            stroke="#1E1E1E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <section className="mb-10 text-center">
        <h1 className="mb-4 text-7xl font-bold text-neutral-950 max-md:text-6xl max-sm:text-4xl">
          Create Pool
        </h1>
        <h2 className="px-3 py-1 text-3xl border-b border-solid border-b-[color:var(--sds-color-border-neutral-default)] text-zinc-800">
          Enter Your Pool Name, Description and Fee
        </h2>
      </section>

      <form className="p-6 mx-auto my-0 max-w-xs rounded-lg border border-solid bg-[color:var(--sds-color-background-default-default)] border-[color:var(--sds-color-border-default-default)] max-md:mx-5 max-md:my-0 max-sm:p-4">
        <FormInput label="Pool Name" />
        <FormInput label="Current Management Fee" />
        <FormInput label="Maximum Management Fee" />
        <FormInput label="Description" type="textarea" />

        <button
          type="submit"
          className="p-3 w-full text-base rounded-lg border border-solid cursor-pointer bg-[color:var(--sds-color-background-brand-default)] border-[color:var(--sds-color-border-brand-default)] text-neutral-100"
        >
          Submit
        </button>
      </form>
    </main>
  );
};
