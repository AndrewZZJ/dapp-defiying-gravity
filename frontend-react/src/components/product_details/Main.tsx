"use client";
import * as React from "react";
import { NavigationBar } from "./NavigationBar";
import { ProductCard } from "./ProductCard";

export default function MainPage() {
  const products = [
    {
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
      title: "Wildfire Insurance",
      category: "Wildfires",
      description: "Protects you and your assets against wildfires",
      altText: "Wildfire",
    },
    {
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
      title: "Earthquake Insurance",
      category: "Earthquakes",
      description:
        "Protects you and your assets against earthquakes and tremors",
      altText: "Earthquake",
    },
    {
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/99c25429344972846f2eaa13689909934b39fdbc",
      title: "Flood Insurance",
      category: "Floods",
      description: "Protects you and your assets against floods",
      altText: "Flood",
    },
  ];

  return (
    <main>
      <NavigationBar />
      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {products.map((product, index) => (
          <ProductCard
            key={index}
            image={product.image}
            title={product.title}
            category={product.category}
            description={product.description}
            altText={product.altText}
          />
        ))}
      </section>
    </main>
  );
}
