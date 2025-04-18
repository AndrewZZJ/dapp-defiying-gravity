"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ProposalItem } from "./ProposalItem";
import { useWallet } from "../../context/WalletContext";
import GraviGovernanceABI from "../../artifacts/contracts/GraviGovernance.sol/GraviGovernance.json";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";

const LoginIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-[32px] h-[32px] flex-shrink-0"
  >
    <path
      d="M20 4H25.3333C26.0406 4 26.7189 4.28095 27.219 4.78105C27.719 5.28115 28 5.95942 28 6.66667V25.3333C28 26.0406 27.719 26.7189 27.219 27.219C26.7189 27.719 26.0406 28 25.3333 28H20M13.3333 22.6667L20 16M20 16L13.3333 9.33333M20 16H4"
      stroke="#1E1E1E"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type ProposalStatus = "Approved" | "Declined" | "In Progress" | "Approved and Executed" | "Unknown";

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: ProposalStatus;
  startDate: number;
  endDate: number;
  snapshotBlock?: number;
  userSnapshotVotingPower?: string;
  votes?: {
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
  };
  userVote?: string;
}

// Toggle mock mode
const useMockData = false;

const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "Increase Treasury Allocation",
    description: "Proposal to increase the treasury allocation for better liquidity.",
    status: "In Progress",
    startDate: Math.floor(Date.now() / 1000) - 86400,
    endDate: Math.floor(Date.now() / 1000) + 86400 * 2,
    votes: {
      forVotes: "1000.0",
      againstVotes: "500.0",
      abstainVotes: "100.0",
    },
    userVote: "For",
  },
  {
    id: 2,
    title: "Partner with OpenSea",
    description: "Proposal to partner with OpenSea for better exposure.",
    status: "Approved",
    startDate: Math.floor(Date.now() / 1000) - 604800,
    endDate: Math.floor(Date.now() / 1000) - 432000,
    votes: {
      forVotes: "2000.0",
      againstVotes: "300.0",
      abstainVotes: "50.0",
    },
    userVote: "Against",
  },
];

export const ProposalsSection: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [delegateInput, setDelegateInput] = useState<string>("");
  const [hasDelegated, setHasDelegated] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [governanceAddress, setGovernanceAddress] = useState<string>("");
  const [graviGovAddress, setGraviGovAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State for success popup
  const [popupTitle, setPopupTitle] = useState(""); // State for popup message
  const [popupMsg, setPopupMsg] = useState("");
  const [votingPower, setVotingPower] = useState<string>("0");
  const [govTokenBalance, setGovTokenBalance] = useState<string>("0");
  const [delegatedAddress, setDelegatedAddress] = useState<string>("");
  
  // Function to connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address); // Update global wallet state
      } catch (error) {
        console.error("Wallet connection failed:", error);
        setPopupTitle("Connection Failed");
        setPopupMsg((error as any)?.message || "Unable to connect wallet.");
        setShowPopup(true);
      }
    } else {
      setPopupTitle("MetaMask Required");
      setPopupMsg("Please install MetaMask to connect your wallet.");
      setShowPopup(true);
    }
  };
  
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch("/addresses.json");
        const data = await response.json();
  
        setGovernanceAddress(data["GraviGovernance"]);
        setGraviGovAddress(data["GraviGov"]);
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    };
  
    fetchAddresses();
  }, []);

  // 2️⃣ Second useEffect – load proposals and delegation logic
  useEffect(() => {
    if (governanceAddress && walletAddress) {
      fetchProposals();
      checkDelegation();
      fetchVotingPower(); // Add this call
      fetchGovTokenBalance(); // Add this call
    } else if (useMockData) {
      fetchProposals(); // allow preview without wallet
    }
  }, [governanceAddress, walletAddress]);

  const getGovernanceContract = (withSigner = false) => {
    if (!governanceAddress || !window.ethereum) throw new Error("Governance address or provider not available");
  
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signerOrProvider = withSigner ? provider.getSigner() : provider;
  
    return new ethers.Contract(governanceAddress, GraviGovernanceABI.abi, signerOrProvider);
  };

  const getGraviGovContract = (withSigner = false) => {
    if (!graviGovAddress || !window.ethereum) throw new Error("GraviGov contract not ready");
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signerOrProvider = withSigner ? provider.getSigner() : provider;
    return new ethers.Contract(graviGovAddress, GraviGovABI.abi, signerOrProvider);
  };

  // Get votes for a proposal
  const getProposalVotes = async (proposalId: number) => {
    try {
      const governance = getGovernanceContract();
      // This returns {againstVotes, forVotes, abstainVotes}
      const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId);
      
      // console.log("Proposal Votes:");
      // console.log(`- Against: ${ethers.utils.formatEther(againstVotes)} voting power`);
      // console.log(`- For: ${ethers.utils.formatEther(forVotes)} voting power`);
      // console.log(`- Abstain: ${ethers.utils.formatEther(abstainVotes)} voting power`);
      
      return {
        againstVotes: ethers.utils.formatEther(againstVotes),
        forVotes: ethers.utils.formatEther(forVotes),
        abstainVotes: ethers.utils.formatEther(abstainVotes)
      };
    } catch (err) {
      console.error("Failed to get proposal votes:", err);
      return { againstVotes: "0", forVotes: "0", abstainVotes: "0" };
    }
  };
  
  // Check if an address has voted on a proposal and what their vote was
  const getAddressVote = async (proposalId: number, voterAddress: string) => {
    try {
      const governance = getGovernanceContract();
      
      // First check if the address has voted at all
      const hasVoted = await governance.hasVoted(proposalId, voterAddress);
      
      if (!hasVoted) {
        return "Has not voted";
      }
      
      // // Create filters for both VoteCast and VoteCastWithParams events
      // const filter1 = governance.filters.VoteCast(voterAddress);
      // const filter2 = governance.filters.VoteCastWithParams(voterAddress);
      
      // // Get all vote events for this voter from both event types
      // const events1 = await governance.queryFilter(filter1);
      // const events2 = await governance.queryFilter(filter2);
      
      // // Combine both event types
      // const allEvents = [...events1, ...events2];

      // // Print the events for debugging
      // console.log("Vote Events:");
      // allEvents.forEach(event => {
      //   console.log(`Event: ${event.event}, Args: ${JSON.stringify(event.args)}`);
      // });
        
      // // Find the vote for this specific proposal
      // const proposalVote = allEvents.find(event => {
      //   if (!event.args) return false;
        
      //   // For VoteCast: args[0]=voter, args[1]=proposalId, args[2]=support, args[3]=weight, args[4]=reason
      //   // For VoteCastWithParams: args[0]=voter, args[1]=proposalId, args[2]=support, args[3]=weight, args[4]=reason, args[5]=params
      //   const eventProposalId = event.args[1]; // ProposalId is the second argument in both events
        
      //   if (!eventProposalId) return false;
        
      //   // Convert both to strings and normalize
      //   return eventProposalId.toString().toLowerCase() === proposalId.toString().toLowerCase();
      // });

      // // Print the found event for debugging
      // console.log("Found Vote Event:", proposalVote);
      
      // if (!proposalVote || !proposalVote.args) {
      //   console.log(`No vote event found for address ${voterAddress} on proposal ${proposalId}`);
      //   return "Vote data unavailable";
      // }
      
      // // Get the support value from the event
      // const support = proposalVote.args.support;
      
      // Map the support value to a human-readable string
      // let voteString;
      // if (support === 0) voteString = "Against";
      // else if (support === 1) voteString = "For";
      // else if (support === 2) voteString = "Abstain";
      // else voteString = "Unknown";

      let voteString;
      if (hasVoted) voteString = "Has voted";
      else voteString = "Has not voted";

      return voteString;
    } catch (err) {
      console.error("Failed to check vote status:", err);
      return "Has not voted";
    }
  };

  // Get votes and address vote status for each proposal
  const enrichProposalWithVotes = async (proposal: Proposal): Promise<Proposal> => {
    if (useMockData) {
      return proposal; // Mock data already has votes
    }
    
    try {
      // Get overall proposal votes
      const votes = await getProposalVotes(proposal.id);
      
      let userVote = "Has not voted";
      if (walletAddress) {
        userVote = await getAddressVote(proposal.id, walletAddress);
      }
      
      return {
        ...proposal,
        votes,
        userVote
      };
    } catch (err) {
      console.error(`Failed to enrich proposal ${proposal.id} with votes:`, err);
      return proposal;
    }
  };

  // New function to get voting power at a specific block
  const getVotingPowerAtBlock = async (address: string, blockNumber: number): Promise<string> => {
    try {
      const contract = getGraviGovContract();
      const votingPower = await contract.getPastVotes(address, blockNumber);
      return ethers.utils.formatEther(votingPower);
    } catch (err) {
      console.error(`Failed to get voting power at block ${blockNumber}:`, err);
      return "0";
    }
  };

  // This function fetches proposals in real time using on-chain data.
  const fetchProposals = async () => {
    setLoading(true);
    if (useMockData) {
      // Sort mock proposals by status order.
      const sortOrder: ProposalStatus[] = ["In Progress", "Approved", "Declined", "Approved and Executed", "Unknown"];
      const sorted = [...mockProposals].sort((a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status));
      setProposals(sorted);
      setLoading(false);
      return;
    }
    try {
      const contract = getGovernanceContract();
      // Fetch the proposal IDs from the contract.
      const proposalIds: number[] = await contract.getAllProposalIds();
      // For each proposal, get the details and the on-chain timing info.
      let proposalsData: Proposal[] = await Promise.all(
        proposalIds.map(async (id: number) => {
          // Retrieve basic proposal details.
          const proposalDetail = await contract.getProposalDetail(id);
          // Retrieve state, snapshot, and deadline using additional contract functions.
          const state = await contract.state(id);
          const snapshot = Number(await contract.proposalSnapshot(id));
          const deadline = Number(await contract.proposalDeadline(id));

          // Get user's voting power at the snapshot block if wallet is connected
          let userSnapshotVotingPower = "0";
          if (walletAddress) {
            userSnapshotVotingPower = await getVotingPowerAtBlock(walletAddress, snapshot);
          }

          // Fetch the latest block to get the current block number and timestamp
          const latestBlock = await contract.provider.getBlock("latest");

          // Ensure we work with numbers
          const currentBlockNumber = Number(latestBlock.number);
          const currentTimestamp = Number(latestBlock.timestamp);

          // Determine snapshot date
          let snapshotDate: number;
          if (snapshot <= currentBlockNumber) {
            const snapshotBlock = await contract.provider.getBlock(snapshot);
            snapshotDate = Number(snapshotBlock.timestamp);
          } else {
            const snapshotBlocksToWait = snapshot - currentBlockNumber;
            const snapshotEstimatedSeconds = snapshotBlocksToWait * 12; // 12 seconds per block
            snapshotDate = currentTimestamp + snapshotEstimatedSeconds;
          }

          // Determine deadline date
          let deadlineDate: number;
          if (deadline <= currentBlockNumber) {
            const deadlineBlock = await contract.provider.getBlock(deadline);
            deadlineDate = Number(deadlineBlock.timestamp);
          } else {
            const deadlineBlocksToWait = deadline - currentBlockNumber;
            const deadlineEstimatedSeconds = deadlineBlocksToWait * 12; // 12 seconds per block
            deadlineDate = currentTimestamp + deadlineEstimatedSeconds;
          }

          // Determine the status.
          let status: ProposalStatus;
          const stateStr = state.toString();
          if (stateStr === "1") { // Active
            status = "In Progress";
          } else if (stateStr === "7") {
            status = "Approved and Executed";
          } else if (stateStr === "2" || stateStr === "3") {
            status = "Declined";
          } else if (stateStr === "4" || stateStr === "5") {
            status = "Approved";
          } else {
            status = "Unknown"; // Fallback
          }

          return {
            id: proposalDetail.id.toHexString(),
            title: proposalDetail.title,
            description: proposalDetail.description,
            status,
            startDate: snapshotDate,
            endDate: deadlineDate,
            snapshotBlock: snapshot,
            userSnapshotVotingPower,
          };
        })
      );

      // Enrich proposals with vote information
      proposalsData = await Promise.all(proposalsData.map(enrichProposalWithVotes));

    // Optionally sort proposals by status.
    const sortOrder: ProposalStatus[] = ["In Progress", "Approved", "Declined", "Approved and Executed" , "Unknown"];
    proposalsData.sort((a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status));

    setProposals(proposalsData);
  } catch (err) {
    console.error("Fetch proposals failed:", err);
  } finally {
    setLoading(false);
  }
};

const checkDelegation = async () => {
  try {
    const contract = getGraviGovContract(); 
    const delegatee = await contract.delegates(walletAddress);
    setHasDelegated(delegatee !== ethers.constants.AddressZero);
  } catch (err) {
    console.error("Delegation check failed:", err);
  }
};
 
const handleDelegate = async () => {
  try {
    const contract = getGraviGovContract(true);
    const tx = await contract.delegate(delegateInput);
    await tx.wait();

    setPopupTitle("Delegation successful!");
    setPopupMsg(`You have delegated your voting power to ${delegateInput}`);
    setShowPopup(true);

    setDelegateInput("");
    checkDelegation();
    fetchVotingPower(); // Add this call to refresh voting power
    fetchGovTokenBalance(); // Add this call
  } catch (err) {
    console.error("Delegation failed:", err);
    setPopupTitle("Delegation failed.");
    setPopupMsg("Error: " + ((err as any)?.reason || (err as any)?.message));
    setShowPopup(true);
  }
};

const openVoteModal = (proposalId: number, snapshotVotingPower: string) => {
  if (!hasDelegated) {
    setPopupTitle("Delegation Required");
    setPopupMsg("You must delegate your voting power before voting.");
    setShowPopup(true);
    return;
  }
  
  const votingPowerAtSnapshot = parseFloat(snapshotVotingPower);
  if (votingPowerAtSnapshot <= 0) {
    setPopupTitle("No Voting Power at Snapshot");
    setPopupMsg("You had no voting power when this proposal was created. Governance voting uses your voting power at the proposal's snapshot block, not your current voting power.");
    setShowPopup(true);
    return;
  }
  
  setSelectedProposalId(proposalId);
  setModalOpen(true);
};

const submitVote = async (proposalId: number, support: number) => {
  try {
    if (useMockData) {
      const voteType = support === 0 ? "Decline" : support === 1 ? "Approve" : "Abstain";
      setPopupTitle(`(Mock) Voted ${voteType} on Proposal #${proposalId}`);
      setPopupMsg("This is a mock vote. No on-chain action taken.");
      setShowPopup(true);
      setModalOpen(false);
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(governanceAddress, GraviGovernanceABI.abi, signer);

    // Cast vote with the appropriate support value (0=Against, 1=For, 2=Abstain)
    const tx = await contract.castVote(proposalId, support);
    await tx.wait();

    // Show success popup
    const voteType = support === 0 ? "Decline" : support === 1 ? "Approve" : "Abstain";
    setPopupTitle(`Voted ${voteType}`);
    setPopupMsg(`Your vote has been successfully submitted on Proposal #${proposalId}`);
    setShowPopup(true);

    setModalOpen(false);

    // Refresh proposals to reflect the new vote
    fetchProposals();
  } catch (err) {
    console.error("Vote failed:", err);
    setPopupTitle(`Vote failed.`);
    setPopupMsg("Error: " + ((err as any)?.reason || (err as any)?.message));
    setShowPopup(true);
  }
};

const fetchVotingPower = async () => {
  if (!walletAddress || !graviGovAddress) return;
  
  try {
    const contract = getGraviGovContract();
    const votes = await contract.getVotes(walletAddress);
    setVotingPower(ethers.utils.formatEther(votes));
  } catch (err) {
    console.error("Failed to fetch voting power:", err);
  }
};

// Add function to fetch the governance token balance
const fetchGovTokenBalance = async () => {
  if (!walletAddress || !graviGovAddress) return;
  
  try {
    const contract = getGraviGovContract();
    const balance = await contract.balanceOf(walletAddress);
    setGovTokenBalance(ethers.utils.formatEther(balance));
    
    // Also fetch the address they delegated to
    const delegatee = await contract.delegates(walletAddress);
    setDelegatedAddress(delegatee);
  } catch (err) {
    console.error("Failed to fetch governance token balance:", err);
  }
};

// Function to check if delegated to self
const isDelegatedToSelf = () => {
  return delegatedAddress.toLowerCase() === walletAddress?.toLowerCase();
};

// Function to format address for display
const formatAddress = (address: string) => {
  if (!address || address.toLowerCase() === "0x0000000000000000000000000000000000000000") {
    return "N/A";
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

return (
  <main className="relative px-8 py-12 bg-white min-h-[100dvh]">
    <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
      Current Proposals
    </h1>

    {/* Success Popup */}
    {showPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50" style={{ width: "600px", height: "300px" }}>
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-3xl font-bold text-center">{popupTitle}</p>
            <pre className="text-sm text-center break-all whitespace-pre-wrap">{popupMsg}</pre>
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

    {walletAddress ? (
      <>
        {/* Delegation Controls */}
        <div className="flex flex-col items-center mb-6">
          <label className="mb-2 font-medium text-lg text-black">Delegate Voting Power:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={delegateInput}
              onChange={(e) => setDelegateInput(e.target.value)}
              placeholder="Enter delegate wallet address"
              className="p-2 border border-gray-300 rounded w-72"
            />
            <button
              onClick={handleDelegate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Delegation
            </button>
          </div>
        </div>

        {/* Token Info and Voting Power Display */}
        <div className="flex justify-center mb-6 gap-4">
          {/* Governance Token Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center w-72">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Your Governance Tokens</h3>
            <p className="text-2xl font-bold text-blue-600">
              {parseFloat(govTokenBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </p>
            <div className="mt-2 text-sm">
              {delegatedAddress ? (
                isDelegatedToSelf() ? (
                  <span className="text-green-600">✓ Self-delegated</span>
                ) : (
                  <span className="text-amber-600">
                    Delegated to: {formatAddress(delegatedAddress)}
                  </span>
                )
              ) : (
                <span className="text-red-500">Not delegated</span>
              )}
            </div>
          </div>

          {/* Current Voting Power Display */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center w-72">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Your Current Voting Power</h3>
            <p className="text-2xl font-bold text-blue-600">{parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
            {parseFloat(votingPower) <= 0 && (
              <p className="text-sm text-red-500 mt-1">
                You need voting power to participate in governance
              </p>
            )}
          </div>
        </div>

        {/* Proposal Section */}
        <section className="flex flex-col items-center w-full mx-auto" style={{ maxWidth: "600px" }}>
          {loading && (
            <p className="text-center text-lg font-medium">Loading proposals...</p>
          )}

          {!loading && proposals.length === 0 && (
            <p className="text-center text-lg font-medium mb-8">
              No proposals found. Please check back later.
            </p>
          )}

          {!loading && proposals.length > 0 && (
            <div className="w-full space-y-4">
              {proposals.map((proposal) => {
                const isInProgress = proposal.status === "In Progress";
                const hasEnded = !isInProgress; // Simply check if not in progress
                const hasSnapshotVotingPower = parseFloat(proposal.userSnapshotVotingPower || "0") > 0;
                const canVote = isInProgress && hasSnapshotVotingPower;

                return (
                  <div key={proposal.id} className="w-full border p-4 rounded-md shadow bg-white">
                    <ProposalItem title={proposal.title} description={proposal.description} status={proposal.status}>
                      <p className="text-sm text-gray-600">Proposal ID: {proposal.id}</p>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(proposal.startDate * 1000).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        End: {new Date(proposal.endDate * 1000).toLocaleString()}
                      </p>
                      
                      {/* Snapshot block and voting power display */}
                      <p className="text-sm text-gray-600 mt-2">
                        Start/Snapshot Block: #{proposal.snapshotBlock}
                      </p>
                      <p className="text-sm text-gray-600">
                        Your Voting Power at Snapshot: 
                        <span className={`font-medium ml-1 ${
                          hasSnapshotVotingPower ? "text-blue-600" : "text-red-500"
                        }`}>
                          {parseFloat(proposal.userSnapshotVotingPower || "0").toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                        {!hasSnapshotVotingPower && !hasEnded && (
                          <span className="block text-xs text-red-500 mt-1">
                            You cannot vote on this proposal due to insufficient voting power at the snapshot block.
                          </span>
                        )}
                      </p>

                      {proposal.votes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-semibold text-sm mb-2">Current Votes</h4>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">For:</span>
                              <span className="text-sm font-medium">{proposal.votes.forVotes} votes</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-red-700">Against:</span>
                              <span className="text-sm font-medium">{proposal.votes.againstVotes} votes</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Abstain:</span>
                              <span className="text-sm font-medium">{proposal.votes.abstainVotes} votes</span>
                            </div>
                            {(() => {
                              const totalVotes =
                                parseFloat(proposal.votes.forVotes) +
                                parseFloat(proposal.votes.againstVotes) +
                                parseFloat(proposal.votes.abstainVotes);
                              const forPercentage = totalVotes > 0 ? (parseFloat(proposal.votes.forVotes) / totalVotes) * 100 : 0;
                              const againstPercentage = totalVotes > 0 ? (parseFloat(proposal.votes.againstVotes) / totalVotes) * 100 : 0;
                              const abstainPercentage = totalVotes > 0 ? (parseFloat(proposal.votes.abstainVotes) / totalVotes) * 100 : 0;

                              return (
                                <>
                                  <div className="mt-2 text-sm text-gray-700">
                                    Total: {totalVotes.toFixed(2)} votes
                                  </div>
                                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${forPercentage}%`, float: 'left' }}></div>
                                    <div className="h-full bg-red-500" style={{ width: `${againstPercentage}%`, float: 'left' }}></div>
                                    <div className="h-full bg-gray-400" style={{ width: `${abstainPercentage}%`, float: 'left' }}></div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {proposal.userVote && (
                        <div className="mt-2 text-sm">
                          Your Voting Status: <span className={`font-medium ${
                            proposal.userVote === "For" ? "text-green-600" :
                            proposal.userVote === "Against" ? "text-red-600" :
                            proposal.userVote === "Abstain" ? "text-gray-500" : ""
                          }`}>
                            {proposal.userVote}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => openVoteModal(proposal.id, proposal.userSnapshotVotingPower || "0")}
                        disabled={hasEnded || !canVote || proposal.userVote !== "Has not voted"}
                        className={`mt-3 px-4 py-2 rounded text-white ${
                          canVote && proposal.userVote === "Has not voted" && !hasEnded
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {hasEnded 
                          ? "Voting Period Ended" 
                          : proposal.userVote !== "Has not voted" 
                            ? "Already Voted" 
                            : !hasDelegated 
                              ? "Delegate First" 
                              : !hasSnapshotVotingPower 
                                ? "No Snapshot Power" 
                                : "Vote"}
                      </button>
                    </ProposalItem>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </>
    ) : (
      <div className="flex justify-center items-center pt-8">
        <article className="flex gap-6 items-start p-6 bg-white rounded-lg border w-[588px] max-sm:w-full">
          <LoginIcon />
          <div className="flex flex-col flex-1 gap-4 items-start">
            <div className="flex flex-col gap-2 items-start w-full">
              <h2 className="w-full text-2xl font-bold tracking-tight leading-7 text-center text-stone-900">
                Crowd-sourced Insurance
              </h2>
              <p className="w-full text-base leading-6 text-center text-neutral-500">
                Please connect your wallet to continue.
              </p>
            </div>
            <div className="flex gap-4 items-center w-full">
              <button
                onClick={connectWallet}
                className="flex-1 gap-2 p-3 text-base leading-4 bg-gray-50 rounded-lg border text-stone-900"
              >
                Connect your wallet
              </button>
            </div>
          </div>
        </article>
      </div>
    )}

    {/* Vote Modal */}
    {modalOpen && selectedProposalId !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Vote on Proposal</h2>
          <p className="text-gray-600 mb-6">How would you like to vote on this proposal?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => submitVote(selectedProposalId, 1)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => submitVote(selectedProposalId, 0)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Decline
            </button>
            <button
              onClick={() => submitVote(selectedProposalId, 2)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Abstain
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </main>
);

};
