"use client";

import * as React from "react";
import { TeamMemberCard } from "./TeamMemberCard";

export const TeamSection: React.FC = () => {
  return (
    <section className="flex flex-col items-start p-16 w-full bg-white max-md:px-5 max-md:max-w-full">
      <h2 className="max-w-full text-2xl font-semibold tracking-tight leading-tight text-stone-900 w-[174px]">
        Team Members
      </h2>
      <div className="flex flex-wrap gap-12 items-stretch self-stretch mt-12 w-full min-h-[357px] max-md:mt-10 max-md:max-w-full">
        <TeamMemberCard
          imageSrc="/img/Andrew.jpg"
          name="Andrew Jiang"
          description="Hi, I'm Andrew, a first year MEng student in ECE at UBC. I'm excited to be involved in the world of decentralized blockchain with this team!"
        />
        <TeamMemberCard
          imageSrc="/img/Daniel.jpg"
          name="Pin Hong Long"
          description="Hi, I'm Pin Hong Long. I am a second year ECE MASc. student at UBC, I've always been interested in computers, programming, and technology-related areas such as video games, apps, and websites."
        />
        <TeamMemberCard
          imageSrc="/img/Parsa.jpg"
          name="Parsa Moheban"
          description="Hi, I'm Parsa. I am a first year ECE MASc. student at UBC. Although my background is in Biomedical Engineering, I'm excited to be developing a platform that can quantitatively improve the lives of its users."
        />
      </div>
      <div className="mt-12 max-w-full w-[699px] max-md:mt-10">
        <div className="flex gap-5 max-md:flex-col items-stretch">
          <div className="w-6/12 max-md:ml-0 max-md:w-full">
            <TeamMemberCard
              imageSrc="/img/Maharshi.jpg"
              name="Maharshi Panchal"
              description="First year MASc student in ECE at UBC. Specializes in areas of software, medicine, and artificial intelligence."
            />
          </div>
          <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
            <TeamMemberCard
              imageSrc="/img/Lily.jpg"
              name="Yangrui Zhu"
              description="I'm Lily (Yangrui), a software engineer and first-year part-time MEng student in ECE, with interests in telecom software, distributed systems and AI."
            />
          </div>
        </div>
      </div>
    </section>
  );
};