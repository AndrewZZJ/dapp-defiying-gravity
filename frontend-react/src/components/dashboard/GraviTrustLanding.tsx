"use client";
import * as React from "react";
import { NavigationHeader } from "./NavigationHeader";
import { HeroSection } from "./HeroSection";
import { LoginCard } from "./LoginCard";

export default function GraviTrustLanding() {
  return (
    <div className="flex flex-col w-full bg-white min-h-[screen]">
      <NavigationHeader />
      <HeroSection />
      <main className="flex justify-center items-center p-16 max-md:p-12 max-sm:p-8">
        <LoginCard />
      </main>
    </div>
  );
}
