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
          imageSrc="https://cdn.builder.io/api/v1/image/assets/TEMP/f5b7430b4a2a33abbf33295d4cc12296b029d85d?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          name="Andrew Jiang"
          description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
        />
        <TeamMemberCard
          imageSrc="/img/Daniel.jpg"
          name="Pin Hong Long"
          description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
        />
        <TeamMemberCard
          imageSrc="/img/Parsa.jpg"
          name="Parsa Moheban"
          description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
        />
      </div>
      <div className="mt-12 max-w-full w-[699px] max-md:mt-10">
        <div className="flex gap-5 max-md:flex-col items-stretch">
          <div className="w-6/12 max-md:ml-0 max-md:w-full">
            <TeamMemberCard
              imageSrc="/img/Maharshi.jpg"
              name="Maharshi Panchal"
              description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
            />
          </div>
          <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
            <TeamMemberCard
              imageSrc="/img/Lily.jpg"
              name="Yangrui Zhu"
              description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
            />
          </div>
        </div>
      </div>
    </section>
  );
};