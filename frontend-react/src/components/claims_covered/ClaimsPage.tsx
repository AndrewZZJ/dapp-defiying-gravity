"use client";
import { Header } from "./Header";
import { ClaimsHeader } from "./ClaimsHeader";
import { ClaimsList } from "./ClaimsList";

export const ClaimsPage = () => {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <main className="w-full min-h-screen bg-white">
        <Header />
        <section className="flex flex-col items-center p-6 bg-gray-50 min-h-[782px]">
          <ClaimsHeader />
          <ClaimsList />
        </section>
      </main>
    </>
  );
};

export default ClaimsPage;
