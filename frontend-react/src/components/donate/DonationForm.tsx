"use client";

import { useState } from "react";
import { InputField } from "./InputField";
import { TextareaField } from "./TextareaField";

export const DonationForm: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [pool, setPool] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    // Handle form submission
    console.log({ amount, pool, message });
  };

  return (
    <section className="flex-1 px-6 pt-6 pb-11 bg-white rounded-lg border border-solid border-zinc-300 max-md:px-5">
      <InputField
        label="Amount to Donate"
        placeholder="Enter amount in ETH"
        value={amount}
        onChange={setAmount}
      />

      <div className="mt-6">
        <InputField
          label="Pool to Donate toward"
          placeholder="Enter pool name"
          value={pool}
          onChange={setPool}
        />
      </div>

      <div className="mt-6">
        <TextareaField label="Message" value={message} onChange={setMessage} />
      </div>

      <div className="flex gap-4 items-center mt-6 leading-none whitespace-nowrap min-h-10 text-neutral-100">
        <button
          onClick={handleSubmit}
          className="overflow-hidden flex-1 shrink gap-2 self-stretch p-3 my-auto w-full rounded-lg border border-solid basis-0 bg-zinc-800 border-zinc-800 min-w-60"
        >
          Submit
        </button>
      </div>
    </section>
  );
};
