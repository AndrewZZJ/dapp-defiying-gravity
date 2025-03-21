"use client";
import { useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

interface Claim {
  id: string;
  title: string;
  information?: string;
}

export const ClaimsList = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const claims: Claim[] = [
    { id: "1", title: "{Cover ID}", information: "{information about cover}" },
    { id: "2", title: "Title" },
    { id: "3", title: "Title" },
    { id: "4", title: "Title" },
    { id: "5", title: "Title" },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center py-4">
      <section className="flex flex-col gap-4 w-full max-w-screen-sm max-sm:px-4 max-sm:py-0">
        {claims.map((claim) => (
          <article
            key={claim.id}
            className="p-4 bg-white rounded-lg border border-solid border-[#e5e7eb]"
          >
            <div className="flex justify-between items-center w-full">
              <h3 className="text-base font-bold text-stone-900">
                {claim.title}
              </h3>
              <button
                onClick={() =>
                  setExpandedId(expandedId === claim.id ? null : claim.id)
                }
                aria-expanded={expandedId === claim.id}
                aria-controls={`claim-content-${claim.id}`}
              >
                {expandedId === claim.id ? (
                  <ChevronUpIcon />
                ) : (
                  <ChevronDownIcon />
                )}
              </button>
            </div>
            {expandedId === claim.id && claim.information && (
              <p
                id={`claim-content-${claim.id}`}
                className="mt-2 text-base text-stone-900"
              >
                {claim.information}
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
};