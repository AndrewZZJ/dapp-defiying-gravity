"use client";
import * as React from "react";
import { useState } from "react";

interface NFTCardProps {
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string; // Full ISO string with time.
  auctionEnded: boolean; // True if NFT is in past bids (auction time expired)
  auctionClaimed: boolean; // True if on-chain "ended" flag is true (already claimed)
  isWinner: boolean;
  hasBid: boolean;
  highestBid?: string; // Formatted on-chain bid (in GraviCha units)
  highestBidder?: string;
  onClaimNFT?: () => Promise<void>;
  onReclaimTokens?: () => Promise<void>;
  onBid?: (bid: string) => Promise<void>; // Bid value as string (e.g., "1.23")
  currentUserAddress: string; // Connected wallet address.
  withdrawable?: string; // Formatted withdrawable amount (e.g., "0.0")
}

export function NFTCard({
  image,
  title,
  category,
  description,
  altText,
  endDate,
  auctionEnded,
  auctionClaimed,
  isWinner,
  hasBid,
  highestBid,
  highestBidder,
  onClaimNFT,
  onReclaimTokens,
  onBid,
  currentUserAddress,
  withdrawable = "0",
}: NFTCardProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [bid, setBid] = useState("");
  const [submittedBid, setSubmittedBid] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false); // State for success popup
  const [popupMessage, setPopupMessage] = useState(""); // State for popup message

  // Lowercase addresses for safe comparison.
  const currentUserAddressLC = currentUserAddress.toLowerCase();
  const highestBidderLC = highestBidder ? highestBidder.toLowerCase() : "";

  const handleSubmit = async () => {
    if (bid.trim() !== "" && onBid) {
      try {
        await onBid(bid);
        setPopupMessage("Bid submitted successfully!");
        setShowPopup(true);
        setShowBidForm(false);
      } catch (error) {
        console.error("Failed to submit bid:", error);
        setPopupMessage("Failed to submit bid. Please try again.");
        setShowPopup(true);
      }
    }
  };

  const handleClaimNFT = async () => {
    if (onClaimNFT) {
      try {
        await onClaimNFT();
        setPopupMessage("NFT claimed successfully!");
        setShowPopup(true);
      } catch (error) {
        console.error("Failed to claim NFT:", error);
        setPopupMessage("Failed to claim NFT. Please try again.");
        setShowPopup(true);
      }
    }
  };

  const handleReclaimTokens = async () => {
    if (onReclaimTokens) {
      try {
        await onReclaimTokens();
        setPopupMessage("Bid money retrieved successfully!");
        setShowPopup(true);
      } catch (error) {
        console.error("Failed to retrieve bid money:", error);
        setPopupMessage("Failed to retrieve bid money. Please try again.");
        setShowPopup(true);
      }
    }
  };

  // Prefer the on-chain highestBid over any locally submitted bid.
  const currentBid = highestBid || submittedBid || bid;

  // Check if the user's bid is valid (greater than the current highest bid).
  const isBidValid = parseFloat(bid) > parseFloat(highestBid || "0");

  return (
    <article className="max-w-7xl mx-auto flex gap-16 items-center max-md:flex-col max-sm:gap-6 relative">
      {/* Left Column: NFT Image */}
      <div className="relative flex-1 w-full">
        <img
          src={image}
          alt={altText}
          className="object-cover w-full h-auto rounded-md"
        />
        {hasBid &&
          currentUserAddressLC === highestBidderLC &&
          (submittedBid || highestBid) && (
            <div className="absolute top-2 left-2 flex flex-col items-start">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {submittedBid || highestBid} GraviCha
              </span>
            </div>
          )}
      </div>

      {/* Right Column: Text Content */}
      <div className="flex flex-col flex-1 gap-6 max-md:w-full justify-center">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <div className="flex flex-col gap-1">
            <span className="self-start p-2 text-base text-emerald-900 rounded-lg bg-emerald-900 bg-opacity-10">
              {category}
            </span>
          </div>
        </div>
        <p className="text-base leading-6 text-neutral-500">{description}</p>

        {/* Auction End Date Label */}
        <div className="text-sm text-neutral-600">
          <strong>{auctionEnded ? "Auction Ended:" : "Auction Ends:"}</strong>{" "}
          {new Date(endDate).toLocaleString()}
        </div>

        {/* Bid and Bidder Information */}
        <div className="text-sm text-neutral-600">
          {currentBid && parseFloat(currentBid) > 0 ? (
            currentUserAddressLC === highestBidderLC ? (
              <div>
                <strong>
                  {auctionEnded ? "Your Victorious Bid:" : "Your current bid:"}{" "}
                </strong>
                {currentBid} GraviCha
              </div>
            ) : (
              <>
                <div>
                  <strong>Highest bid: </strong>
                  {currentBid} GraviCha
                </div>
                {highestBidderLC &&
                  currentUserAddressLC !== highestBidderLC && (
                    <div>
                      <strong>Highest bidder: </strong>
                      {highestBidder}
                    </div>
                  )}
              </>
            )
          ) : (
            <span className="italic text-neutral-400">
              {auctionEnded ? "No Bids Made" : "No Bids Yet!"}
            </span>
          )}
        </div>

        {/* Auction Controls */}
        {!auctionEnded ? (
          // Active auctions: show bid form and Bid button.
          <>
            <button
              className="p-3 w-full text-base rounded-lg bg-black text-white hover:bg-gray-800"
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
                  placeholder="Price to bid (GraviCha)"
                  value={bid}
                  onChange={(e) => setBid(e.target.value)}
                  className="p-2 border border-zinc-300 rounded"
                />
                <button
                  className={`p-2 rounded ${
                    isBidValid
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={!isBidValid}
                  title={
                    !isBidValid
                      ? "Your bid must be higher than the current highest bid."
                      : ""
                  }
                >
                  Submit
                </button>
              </div>
            )}
          </>
        ) : (
          // Past auctions.
          <div className="flex flex-col gap-4">
            {isWinner && !auctionClaimed && (
              <button
                className="p-3 w-full text-base rounded-lg bg-green-600 text-white hover:bg-green-700"
                onClick={handleClaimNFT}
              >
                Claim NFT
              </button>
            )}
            {!isWinner && parseFloat(withdrawable) > 0 && (
              <button
                className="p-3 w-full text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleReclaimTokens}
              >
                Retrieve Bid Money
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}