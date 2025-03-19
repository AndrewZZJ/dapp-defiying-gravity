export const ClaimsHeader = () => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 text-7xl font-bold tracking-tighter text-neutral-950 max-sm:text-5xl">
        Claims
      </h1>
      <nav className="flex gap-4 mb-8 max-sm:flex-col max-sm:items-center">
        <button className="px-3 py-1 text-3xl border-b border-solid cursor-pointer border-b-neutral-500 text-neutral-500 max-sm:text-2xl hover:text-neutral-700">
          Your Covers
        </button>
        <button className="px-3 py-1 text-3xl border-b border-solid cursor-pointer border-b-neutral-500 text-neutral-500 max-sm:text-2xl hover:text-neutral-700">
          Buy Covers
        </button>
      </nav>
    </div>
  );
};
