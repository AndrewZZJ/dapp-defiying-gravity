"use client";
import React, { useState } from "react";

const mockModerators = [
  { address: "0x1234...abcd", votes: 12 },
  { address: "0x5678...efgh", votes: 8 },
  { address: "0x9abc...ijkl", votes: 5 },
];

export const ModeratorNominations: React.FC = () => {
  const [nomineeInput, setNomineeInput] = useState<string>("");
  const [moderators, setModerators] = useState(mockModerators);
  const [votedFor, setVotedFor] = useState<Set<string>>(new Set()); // tracks which moderators were voted on

  const handleNominate = () => {
    if (!nomineeInput.trim()) return alert("Enter a valid wallet address.");
    alert(`(Mock) Nominated ${nomineeInput}`);
    setNomineeInput("");
  };

  const handleVote = (address: string) => {
    if (votedFor.has(address)) return;

    alert(`(Mock) Voted for moderator ${address}`);
    setModerators((prev) =>
      prev.map((mod) =>
        mod.address === address ? { ...mod, votes: mod.votes + 1 } : mod
      )
    );
    setVotedFor((prev) => new Set(prev).add(address));
  };

  return (
    <section className="bg-white p-8 rounded-lg shadow mx-auto max-w-screen-sm my-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Nominate Moderators
      </h2>

      {/* Nomination input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 items-center justify-center">
        <input
          type="text"
          value={nomineeInput}
          onChange={(e) => setNomineeInput(e.target.value)}
          placeholder="Enter wallet address"
          className="p-2 border border-gray-300 rounded w-72"
        />
        <button
          onClick={handleNominate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Nomination
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700 text-center">
        Current Nominations
      </h3>

      <ul className="flex flex-col gap-4">
        {moderators.map((mod) => {
          const hasVoted = votedFor.has(mod.address);
          return (
            <li
              key={mod.address}
              className="flex items-center justify-between border p-4 rounded-md shadow-sm"
            >
              <div className="text-gray-800 font-mono">{mod.address}</div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{mod.votes} votes</span>
                <button
                  onClick={() => handleVote(mod.address)}
                  disabled={hasVoted}
                  className={`px-3 py-1 text-sm rounded text-white ${
                    hasVoted
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {hasVoted ? "Voted" : "Vote"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
