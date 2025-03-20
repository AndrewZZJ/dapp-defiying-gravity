"use client";

import * as React from "react";
import { Header } from "../navigation/Header";
import { Hero } from "./Hero";
import { TestimonialsSection } from "./TestimonialsSection";

function HomePage() {
  return (
    <main className="overflow-hidden bg-white">
      <Header />
      <Hero />
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/37e23b4be5eade6bfe3e63813a96ca6cdf9fa611?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
        alt="Decorative section divider"
        className="object-contain w-full aspect-[3] max-md:max-w-full"
      />
      <TestimonialsSection />
    </main>
  );
}

export default HomePage;
