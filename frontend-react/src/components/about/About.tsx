"use client";

import * as React from "react";
import { Header } from "../navigation/Header";
import { Hero } from "./Hero";
import { TeamSection } from "./TeamSection";

export default function About() {
  return (
    <main className="overflow-hidden bg-white">
      <Header />
      <Hero />
      <TeamSection />
    </main>
  );
}
