import * as React from "react";

interface TestimonialCardProps {
  quote: string;
  avatarUrl: string;
  title: string;
  description: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  avatarUrl,
  title,
  description,
}) => {
  return (
    <article className="flex-1 shrink p-6 bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-[300px] max-md:px-5">
      <blockquote className="flex-1 shrink w-full text-2xl font-semibold tracking-tight leading-tight basis-0 text-stone-900">
        {quote}
      </blockquote>
      <div className="flex gap-3 items-start mt-6 max-w-full text-base leading-snug w-[139px]">
        <img
          src={avatarUrl}
          alt={`${title}'s avatar`}
          className="object-contain shrink-0 w-10 rounded-full aspect-square"
        />
        <div className="flex-1 shrink basis-0">
          <h3 className="font-semibold text-neutral-500">{title}</h3>
          <p className="text-zinc-400">{description}</p>
        </div>
      </div>
    </article>
  );
};
