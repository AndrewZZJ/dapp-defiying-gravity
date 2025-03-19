import * as React from "react";
import { PriceIcon } from "./PriceIcon";

interface ProductCardProps {
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
}

export function ProductCard({
  image,
  title,
  category,
  description,
  altText,
}: ProductCardProps) {
  return (
    <article className="flex gap-16 items-start max-md:flex-col max-sm:gap-6">
      <img
        src={image}
        className="object-cover flex-1 w-full h-auto max-md:w-full"
        alt={altText}
      />
      <div className="flex flex-col flex-1 gap-6 max-md:w-full">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <div className="flex flex-col gap-1">
            <span className="self-start p-2 text-base text-emerald-900 rounded-lg bg-emerald-900 bg-opacity-10">
              {category}
            </span>
            <div className="flex items-end">
              <PriceIcon />
            </div>
          </div>
        </div>
        <p className="text-base leading-6 text-neutral-500">{description}</p>
        <button className="p-3 w-full text-base rounded-lg bg-stone-900 text-neutral-100">
          Learn more
        </button>
      </div>
    </article>
  );
}
