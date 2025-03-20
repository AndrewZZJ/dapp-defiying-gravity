"use client";
import * as React from "react";
import { Header } from "../navigation/Header";
import { ContactForm } from "./ContactForm";

export const ContactUs: React.FC = () => {
  return (
    <main className="overflow-hidden bg-zinc-800">
      <Header />

      <section className="relative flex flex-col justify-center items-center px-6 py-40 w-screen min-h-[988px] max-md:px-5 max-md:py-24 max-md:max-w-full">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/d7a61cbae74a720dcf57a8119839d5f1c81c8d13?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Background"
          className="object-cover absolute inset-0 w-full h-full"
        />

        <div className="relative z-10 max-w-full leading-tight text-center text-zinc-800 w-[956px]">
          <h1 className="text-7xl font-bold tracking-tighter max-md:max-w-full max-md:text-4xl">
            Questions about GraviTrust?
          </h1>
          <h2 className="mt-2 text-3xl max-md:max-w-full">Reach Out!</h2>
        </div>

        <ContactForm />
      </section>
    </main>
  );
};

export default ContactUs;