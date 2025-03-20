"use client";
import * as React from "react";
import { FormInput } from "./FormInput";

export const ClaimForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    incidentName: "",
    dateOfOccurrence: "",
    incidentLocation: "",
    claimAmount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center py-4">
      <section className="flex flex-col gap-0 w-full max-w-md px-4 py-4">
        <article className="p-4 bg-white rounded-lg border border-solid border-[#e5e7eb]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormInput
              label="Incident Name"
              value={formData.incidentName}
              onChange={(value) => updateField("incidentName", value)}
              className="mb-2"
            />
            <FormInput
              label="Date of Occurrence"
              value={formData.dateOfOccurrence}
              onChange={(value) => updateField("dateOfOccurrence", value)}
              className="mb-2"
            />
            <FormInput
              label="Incident Location"
              value={formData.incidentLocation}
              onChange={(value) => updateField("incidentLocation", value)}
              className="mb-2"
            />
            <FormInput
              label="Claim Amount"
              value={formData.claimAmount}
              onChange={(value) => updateField("claimAmount", value)}
              className="mb-2"
            />
            <button
              type="submit"
              className="w-full p-3 text-base text-center rounded-lg cursor-pointer bg-black text-white hover:bg-gray-800"
            >
              Submit
            </button>
          </form>
        </article>
      </section>
    </div>
  );
};