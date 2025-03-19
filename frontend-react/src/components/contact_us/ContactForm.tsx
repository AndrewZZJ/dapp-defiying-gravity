"use client";
import * as React from "react";
import { FormInput } from "./FormInput";
import { FormTextarea } from "./FormTextarea";
import { Button } from "./Button";

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    surname: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative p-6 mt-8 w-80 max-w-full text-base whitespace-nowrap bg-white rounded-lg border border-solid border-zinc-300 min-w-80 max-md:px-5"
    >
      <div className="space-y-6">
        <FormInput
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Value"
        />

        <FormInput
          label="Surname"
          name="surname"
          value={formData.surname}
          onChange={handleChange}
          placeholder="Value"
        />

        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Value"
        />

        <FormTextarea
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Value"
        />

        <div className="flex gap-4 items-center w-full leading-none text-neutral-100">
          <Button type="submit" fullWidth>
            Submit
          </Button>
        </div>
      </div>
    </form>
  );
};
