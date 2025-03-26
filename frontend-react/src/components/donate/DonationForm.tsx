"use client";

import { useState } from "react";
import { InputField } from "./InputField";
import { TextareaField } from "./TextareaField";

export const DonationForm: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State to store submitted data for the OverviewPanel
  const [submittedData, setSubmittedData] = useState<{
    walletAddress: string;
    donatedPool: string | null; // Allow string or null
    amountDonated: string;
    message: string;
  }>({
    walletAddress: "0x1234...abcd", // Placeholder wallet address
    donatedPool: null,
    amountDonated: "",
    message: "",
  });

  const handleSubmit = () => {
    // Update the submitted data
    setSubmittedData({
      walletAddress: "0x1234...abcd", // Placeholder wallet address
      donatedPool: selectedPool,
      amountDonated: amount,
      message: message,
    });

    // Reset the form (optional)
    setAmount("");
    setSelectedPool(null);
    setMessage("");
  };

  const poolOptions = [
    { title: "Wildfire", color: "bg-orange-500" }, // Sunset orange
    { title: "Flood", color: "bg-blue-300" }, // Light baby blue
    { title: "Earthquake", color: "bg-tan-500" }, // Muted tan
  ];

  const selectedColor = poolOptions.find((pool) => pool.title === selectedPool)?.color || "bg-white";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Donation Form Section */}
      <section className="flex-1 px-6 pt-6 pb-11 bg-white rounded-lg border border-solid border-zinc-300 max-md:px-5">
        <InputField
          label="Amount to Donate"
          placeholder="Enter amount in ETH"
          value={amount}
          onChange={setAmount}
        />

        <div className="mt-4">
          <div
            className={`relative border border-zinc-300 rounded-md shadow-sm ${selectedColor} text-black`}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-left"
            >
              <div className="text-sm font-medium">
                {selectedPool || "Select a Pool to Donate Toward"}
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 bg-white border border-zinc-300 rounded-md shadow-md z-10">
                {poolOptions.map((pool) => (
                  <button
                    key={pool.title}
                    onClick={() => {
                      setSelectedPool(pool.title);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100`}
                  >
                    {pool.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <TextareaField label="Message" value={message} onChange={setMessage} />
        </div>

        <div className="flex gap-4 items-center mt-4 leading-none whitespace-nowrap min-h-10 text-neutral-100">
          <button
            onClick={handleSubmit}
            className="overflow-hidden flex-1 shrink gap-2 self-stretch p-3 my-auto w-full rounded-md border border-solid basis-0 bg-black text-white hover:bg-gray-800 hover:text-gray-200 min-w-60"
          >
            Donate
          </button>
        </div>
      </section>

      {/* Overview Panel Section */}
      <section className="flex-1 self-start px-5 pt-6 pb-2.5 leading-snug bg-white rounded-lg border border-solid border-zinc-300 text-stone-900 max-md:pr-5">
        <h2 className="whitespace-nowrap bg-white">Overview</h2>

        <div className="mt-14 max-md:mt-10">
          <p>Wallet Address:</p>
          <p className="text-sm text-gray-700">{submittedData.walletAddress}</p>
        </div>

        <div className="mt-4">
          <p>Donated Pool:</p>
          <p className="text-sm text-gray-700">{submittedData.donatedPool || "None"}</p>
        </div>

        <div className="mt-4">
          <p>Amount Donated:</p>
          <p className="text-sm text-gray-700">{submittedData.amountDonated || "0 ETH"}</p>
        </div>

        <div className="mt-4">
          <p>Message:</p>
          <p className="text-sm text-gray-700">{submittedData.message || "No message provided."}</p>
        </div>
      </section>
    </div>
  );
};