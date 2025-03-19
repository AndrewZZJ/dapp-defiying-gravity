export const OverviewPanel: React.FC = () => {
  return (
    <section className="flex-1 self-start px-5 pt-6 pb-2.5 leading-snug bg-white rounded-lg border border-solid border-zinc-300 text-stone-900 max-md:pr-5">
      <h2 className="whitespace-nowrap bg-white">Overview</h2>

      <div className="mt-14 max-md:mt-10">
        <p>Wallet Address:</p>
      </div>

      <div className="mt-4">
        <p>Donated Pool:</p>
      </div>

      <div className="mt-4">
        <p>Amount Donated:</p>
      </div>
    </section>
  );
};
