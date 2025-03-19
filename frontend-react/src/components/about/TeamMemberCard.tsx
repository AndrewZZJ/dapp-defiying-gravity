"use client";

import * as React from "react";

interface TeamMemberCardProps {
  imageSrc: string;
  name: string;
  description: string;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  imageSrc,
  name,
  description,
}) => {
  return (
    <article className="flex flex-wrap flex-1 shrink gap-6 items-start self-stretch p-6 my-auto bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 max-md:px-5">
      <img
        src={imageSrc}
        alt={`${name}'s profile`}
        className="object-contain shrink-0 w-40 aspect-square min-h-40 min-w-40"
      />
      <div className="flex-1 shrink basis-0 min-w-40">
        <div className="w-full">
          <h3 className="text-2xl font-semibold tracking-tight leading-tight text-stone-900">
            {name}
          </h3>
          <p className="mt-2 text-base leading-6 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
};
