"use client";
import * as React from "react";
import { useState } from "react";

interface NFTCardProps {
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string; // Auction end date
  isWinner: boolean; // Whether the user is the winner
  hasBid: boolean; // Whether the user placed a bid
  onClaimNFT?: () => void; // Callback for claiming the NFT
  onReclaimTokens?: () => void; // Callback for reclaiming tokens
}

export function NFTCard({
  image,
  title,
  category,
  description,
  altText,
  endDate,
  isWinner,
  hasBid,
  onClaimNFT,
  onReclaimTokens,
}: NFTCardProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [bid, setBid] = useState("");
  const [submittedBid, setSubmittedBid] = useState<string | null>(null);

  const handleSubmit = () => {
    if (bid.trim() !== "") {
      // AJ: a backend method for joining the bidding.
      setSubmittedBid(bid);
      setShowBidForm(false);
    }
  };

  // Check if the auction has ended
  const hasAuctionEnded = new Date(endDate) < new Date();

  return (
    <article className="flex gap-16 items-start max-md:flex-col max-sm:gap-6 relative">
      <div className="relative flex-1 w-full">
        <img
          src={image}
          className="object-cover w-full h-auto rounded-md"
          alt={altText}
        />
        {submittedBid && (
          <div className="absolute top-2 left-2 flex flex-col items-start">
            <span className="text-green-600 text-xl">✅</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {bid} ETH
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-6 max-md:w-full">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <div className="flex flex-col gap-1">
            <span className="self-start p-2 text-base text-emerald-900 rounded-lg bg-emerald-900 bg-opacity-10">
              {category}
            </span>
          </div>
        </div>
        <p className="text-base leading-6 text-neutral-500">{description}</p>

        {/* Display the auction end date */}
        <div className="text-sm text-neutral-600">
          <strong>Auction Ends:</strong> {endDate}
        </div>

        {!hasAuctionEnded ? (
          <>
            {submittedBid || bid ? (
              <div className="text-sm text-neutral-600">
                Current highest bid: {submittedBid || bid} ETH
              </div>
            ) : (
              <div className="text-sm text-neutral-400 italic">No bids yet</div>
            )}

            <button
              className="p-3 w-full text-base rounded-lg bg-black text-white"
              onClick={() => setShowBidForm(!showBidForm)}
            >
              {showBidForm ? "Cancel" : "Bid"}
            </button>

            {showBidForm && (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price to bid (ETH)"
                  value={bid}
                  onChange={(e) => setBid(e.target.value)}
                  className="p-2 border border-zinc-300 rounded"
                />
                <button
                  className="p-2 rounded bg-green-600 text-white hover:bg-green-700"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Buttons for after the auction ends */}
            <button
              className={`p-3 w-full text-base rounded-lg ${
                !isWinner && hasBid
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={() => !isWinner && hasBid && onReclaimTokens && onReclaimTokens()}
              disabled={isWinner || !hasBid}
            >
              Retrieve Bid Money
            </button>
            <button
              className={`p-3 w-full text-base rounded-lg ${
                isWinner
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={() => isWinner && onClaimNFT && onClaimNFT()}
              disabled={!isWinner}
            >
              Claim NFT
            </button>
          </div>
        )}
      </div>
    </article>
  );
}