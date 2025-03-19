import * as React from "react";
import { TestimonialCard } from "./TestimonialCard";

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="p-16 w-full whitespace-nowrap bg-white max-md:px-5 max-md:max-w-full">
      <div className="max-w-full leading-tight w-[113px]">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Heading
        </h2>
        <p className="mt-2 text-xl text-neutral-500">Subheading</p>
      </div>
      <div className="flex flex-wrap gap-12 items-start mt-12 w-full max-md:mt-10 max-md:max-w-full">
        {[
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/578ec83f2d1a33e42d616e455d3e787ebf6b0c3f?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/994e3ad296517d5af8c8d2ac8fa1b97f2bd4f678?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/7b376dee385d26dee270d2f4e91ebcb3b16dd345?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/578ec83f2d1a33e42d616e455d3e787ebf6b0c3f?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/994e3ad296517d5af8c8d2ac8fa1b97f2bd4f678?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
          {
            avatarUrl:
              "https://cdn.builder.io/api/v1/image/assets/TEMP/7b376dee385d26dee270d2f4e91ebcb3b16dd345?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351",
            quote: '"Quote"',
          },
        ].map((testimonial, index) => (
          <TestimonialCard
            key={index}
            quote={testimonial.quote}
            avatarUrl={testimonial.avatarUrl}
            title="Title"
            description="Description"
          />
        ))}
      </div>
    </section>
  );
};
