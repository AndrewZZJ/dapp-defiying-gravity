"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import GraviDAOABI from "../../artifacts/contracts/GraviDAO.sol/GraviDAO.json";
import { useWallet } from "../../context/WalletContext";

interface Moderator {
  address: string;
  votes: number;
  nominator?: string;
}

export const ModeratorNominations: React.FC = () => {
  const { walletAddress } = useWallet();
  const [nomineeInput, setNomineeInput] = useState<string>("");
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [votedFor, setVotedFor] = useState<Set<string>>(new Set());
  const [daoAddress, setDaoAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

  // Function to show popup
  const showMessage = (title: string, message: string) => {
    setPopupTitle(title);
    setPopupMsg(message);
    setShowPopup(true);
  };

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await fetch("/addresses.json");
        const data = await res.json();
        setDaoAddress(data["GraviDAO"]);
      } catch (err) {
        console.error("Failed to load DAO contract address", err);
      }
    };

    if (walletAddress) {
      loadAddresses();
    }
  }, [walletAddress]);

  useEffect(() => {
    const loadModerators = async () => {
      if (!daoAddress || !walletAddress) return;
      
      try {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const daoContract = new ethers.Contract(daoAddress, GraviDAOABI.abi, provider);
        
        // Get all nominated moderators
        const [moderatorAddresses, votes, nominators] = await daoContract.getAllNominatedModerators();
        
        // Create moderator objects
        const moderatorList: Moderator[] = moderatorAddresses.map((address: string, index: number) => ({
          address,
          votes: votes[index].toNumber(),
          nominator: nominators[index]
        }));
        
        setModerators(moderatorList);
        
        // Check which moderators the user has voted for
        const votedSet = new Set<string>();
        for (const mod of moderatorAddresses) {
          const hasVoted = await daoContract.hasVotedForModerator(walletAddress, mod);
          if (hasVoted) votedSet.add(mod);
        }
        setVotedFor(votedSet);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load moderators:", err);
        setIsLoading(false);
      }
    };

    loadModerators();
  }, [daoAddress, walletAddress]);

  const handleNominate = async () => {
    if (!nomineeInput.trim()) {
      return showMessage("Input Error", "Enter a valid wallet address.");
    }
    
    if (!daoAddress || !walletAddress) {
      return showMessage("Connection Error", "Wallet not connected or contract not loaded.");
    }
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const daoContract = new ethers.Contract(daoAddress, GraviDAOABI.abi, signer);
      
      // Nominate the moderator
      const tx = await daoContract.nominateModerator(nomineeInput);
      showMessage("Transaction Submitted", `Nomination transaction submitted: ${tx.hash}`);
      
      // Wait for transaction to be mined
      await tx.wait();
      showMessage("Nomination Successful", `Successfully nominated ${nomineeInput} as moderator.`);
      
      // Refresh moderator list
      const [moderatorAddresses, votes, nominators] = await daoContract.getAllNominatedModerators();
      const moderatorList: Moderator[] = moderatorAddresses.map((address: string, index: number) => ({
        address,
        votes: votes[index].toNumber(),
        nominator: nominators[index]
      }));
      
      setModerators(moderatorList);
      setNomineeInput("");
      setIsLoading(false);
    } catch (err: any) {
      console.error("Nomination failed:", err);
      showMessage(
        "Nomination Failed", 
        err.reason || err.message || "Nomination failed. See console for details."
      );
      setIsLoading(false);
    }
  };
  
  const handleVote = async (address: string) => {
    if (votedFor.has(address)) return;
    
    if (!daoAddress || !walletAddress) {
      return showMessage("Connection Error", "Wallet not connected or contract not loaded.");
    }
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const daoContract = new ethers.Contract(daoAddress, GraviDAOABI.abi, signer);
      
      // Vote for the moderator
      const tx = await daoContract.voteForModerator(address);
      showMessage("Transaction Submitted", `Vote transaction submitted: ${tx.hash}`);
      
      // Wait for transaction to be mined
      await tx.wait();
      showMessage("Vote Recorded", `Successfully voted for moderator ${address}`);
      
      // Update the moderator's vote count
      setModerators((prev) =>
        prev.map((mod) =>
          mod.address === address ? { ...mod, votes: mod.votes + 1 } : mod
        )
      );
      setVotedFor((prev) => new Set(prev).add(address));
      setIsLoading(false);
    } catch (err: any) {
      console.error("Voting failed:", err);
      showMessage(
        "Voting Failed", 
        err.reason || err.message || "Voting failed. See console for details."
      );
      setIsLoading(false);
    }
  };

  // Only render the component content if wallet is connected
  if (!walletAddress) {
    return null; // Don't render anything when wallet is not connected
  }

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
          disabled={isLoading}
        />
        <button
          onClick={handleNominate}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit Nomination"}
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700 text-center">
        Current Nominations
      </h3>

      {isLoading && moderators.length === 0 ? (
        <div className="text-center py-4">Loading moderator data...</div>
      ) : moderators.length === 0 ? (
        <div className="text-center py-4">No moderators have been nominated yet.</div>
      ) : (
        <ul className="flex flex-col gap-4">
          {[...moderators]
            .sort((a, b) => b.votes - a.votes) // Sort by highest votes first
            .map((mod) => {
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
                    disabled={hasVoted || isLoading}
                    className={`px-3 py-1 text-sm rounded text-white ${
                      hasVoted || isLoading
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
      )}

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
            >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-3xl font-bold text-center">{popupTitle}</p>
                <pre className="text-sm text-center break-all whitespace-pre-wrap">
                  {popupMsg}
                </pre>
                <button
                onClick={() => setShowPopup(false)}
                className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                OK
                </button>
            </div>
            </div>
        </div>
      )}
    </section>
  );
};