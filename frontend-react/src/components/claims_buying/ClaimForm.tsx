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
    <form
      onSubmit={handleSubmit}
      className="p-6 w-80 bg-white rounded-lg border border-solid border-neutral-200 max-md:w-full max-md:max-w-xs"
    >
      <FormInput
        label="Incident Name"
        value={formData.incidentName}
        onChange={(value) => updateField("incidentName", value)}
      />
      <FormInput
        label="Date of Occurence"
        value={formData.dateOfOccurrence}
        onChange={(value) => updateField("dateOfOccurrence", value)}
      />
      <FormInput
        label="Incident Location"
        value={formData.incidentLocation}
        onChange={(value) => updateField("incidentLocation", value)}
      />
      <FormInput
        label="Claim Amount"
        value={formData.claimAmount}
        onChange={(value) => updateField("claimAmount", value)}
      />
      <button
        type="submit"
        className="w-full p-3 text-base text-center rounded-lg cursor-pointer bg-stone-900 text-neutral-100 hover:bg-stone-800"
      >
        Submit
      </button>
    </form>
  );
};
