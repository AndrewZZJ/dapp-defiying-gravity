"use client";
import * as React from "react";
import { Button } from "./Button";

export const ProposalForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    title: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="self-center px-6 pt-6 pb-11 mt-16 w-80 max-w-full text-base bg-white rounded-lg border border-solid border-zinc-300 max-md:px-5 max-md:mt-10"
    >
      <div className="w-full">
        <label className="leading-snug text-stone-900">Title</label>
        <input
          type="text"
          placeholder="Please title your submission"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="overflow-hidden flex-1 shrink self-stretch px-4 py-3 mt-2 w-full leading-none bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 text-zinc-400 placeholder:text-zinc-400"
        />
      </div>
      <div className="mt-6 w-full">
        <label className="leading-snug text-stone-900">Subject</label>
        <input
          type="text"
          placeholder="Enter a brief subject line"
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          className="overflow-hidden flex-1 shrink self-stretch px-4 py-3 mt-2 w-full leading-none bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 text-zinc-400 placeholder:text-zinc-400"
        />
      </div>
      <div className="mt-6 w-full">
        <label className="leading-snug text-stone-900">Message</label>
        <div className="relative">
          <textarea
            placeholder="Please provide details of your proposal"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            className="flex overflow-hidden w-full px-4 py-3 mt-2 leading-6 bg-white rounded-lg border border-solid border-zinc-300 min-h-20 min-w-60 text-zinc-400 placeholder:text-zinc-400 resize-none"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/e7030f78278d7c5e1f552a2fc04e70b5790a8dfc?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
            className="object-contain absolute bottom-1.5 z-0 shrink-0 aspect-square h-[7px] right-[5px] w-[7px]"
            alt=""
          />
        </div>
      </div>
      <div className="flex gap-4 items-center mt-6 leading-none whitespace-nowrap min-h-10">
        <Button variant="primary" className="flex-1">
          Submit
        </Button>
      </div>
    </form>
  );
};
