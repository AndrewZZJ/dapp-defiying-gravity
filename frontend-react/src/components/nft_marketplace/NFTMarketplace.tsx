import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { NFTCard } from "./NFTCard";
import { DonorLeaderboard } from "./DonorLeaderboard";
import { useWallet } from "../../context/WalletContext";
import GraviPoolNFTABI from "../../artifacts/contracts/tokens/GraviPoolNFT.sol/GraviPoolNFT.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";
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

interface NFT {
  id: number;
  image: string;
  title: string;
  category: string;
  description: string;
  altText: string;
  endDate: string; // Full ISO string (auction end time)
  isWinner: boolean;
  ended: boolean; // on-chain ended flag (true if NFT already claimed)
  highestBid?: string; // Formatted in GraviCha units.
  highestBidder?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export default function NFTMarketplace() {
  const { walletAddress, setWalletAddress } = useWallet();
  const [activeBids, setActiveBids] = useState<NFT[]>([]);
  const [pastBids, setPastBids] = useState<NFT[]>([]);
  const [withdrawable, setWithdrawable] = useState<string>("0");

  // Popup state (visual only)
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

  // Connect wallet.
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        getNFTAuctionStatus();
      } catch (error) {
        console.error("Wallet connection failed:", error);
        setPopupTitle("Wallet Connection Failed");
        setPopupMsg((error as any)?.message || "Unable to connect wallet.");
        setShowPopup(true);
      }
    } else {
      setPopupTitle("MetaMask Required");
      setPopupMsg("Please install MetaMask to connect your wallet.");
      setShowPopup(true);
    }
  };

  const fetchNFTData = async (
    tokenURIs: { tokenId: string; tokenURI: string }[]
  ) => {
    try {
      const nftData = await Promise.all(
        tokenURIs.map(async ({ tokenId, tokenURI }) => {
          const response = await fetch(tokenURI);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch NFT data from ${tokenURI}: ${response.statusText}`
            );
          }
          const nftJson = await response.json();
          return {
            id: tokenId,
            name: nftJson.name,
            description: nftJson.description,
            image: nftJson.image,
            attributes: nftJson.attributes,
          };
        })
      );
      return nftData;
    } catch (error) {
      console.error("Failed to fetch NFT data:", error);
      return [];
    }
  };

  const getNFTAuctionStatus = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    try {
      // Get current time from latest block.
      const latestBlock = await provider.getBlock("latest");
      const now = new Date(latestBlock.timestamp * 1000);

      const response = await fetch("/addresses.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses.json: ${response.statusText}`);
      }
      const deploymentConfig = await response.json();
      const graviGovAddress = deploymentConfig["GraviGov"];
      const graviChaAddress = deploymentConfig["GraviCha"];
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviGovAddress || !graviChaAddress || !graviPoolNFTAddress) {
        throw new Error("Required addresses not found in addresses.json.");
      }

      // Instantiate GraviPoolNFT contract.
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        provider
      );

      // Fetch withdrawable amount for the current user.
      if (walletAddress) {
        // Need the signer to call withdrawableAmount.
        const signer = provider.getSigner();
        const userGraviPoolNFT = new ethers.Contract(
          graviPoolNFTAddress,
          GraviPoolNFTABI.abi,
          signer
        );
        // Fetch the withdrawable amount.
        const pending = await userGraviPoolNFT.withdrawableAmount();
        const pendingFormatted = ethers.utils.formatUnits(pending, 18);
        setWithdrawable(pendingFormatted);
      }

      const tokenIds = await graviPoolNFT.getAuctionedNFTs();

      const tokenURIs = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const tokenURI = await graviPoolNFT.tokenURI(tokenId);
          return { tokenId: tokenId.toString(), tokenURI };
        })
      );

      const tokenDetails = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const details = await graviPoolNFT.getAuctionDetails(tokenId);
          return { tokenId: tokenId.toString(), details };
        })
      );

      const nftData = await fetchNFTData(tokenURIs);
      // Auction duration: 7 days (milliseconds)
      const auctionDuration = 7 * 24 * 60 * 60 * 1000;

      const mergedNFTs: NFT[] = nftData.map((nft, index) => {
        const detail = tokenDetails[index].details;
        // Compute auction start time.
        const auctionStartTime = new Date(detail.startTime.toNumber() * 1000);
        // Calculate auction end time.
        const calculatedEndDate = new Date(auctionStartTime.getTime() + auctionDuration);
        // Use full ISO string for endDate.
        const endDate = calculatedEndDate.toISOString();
        // The on-chain "ended" flag indicates if claimed.
        const ended = detail.ended;
        // Determine isWinner: if auction time has passed and wallet matches highestBidder.
        const isWinner: boolean =
          now > calculatedEndDate && walletAddress
            ? detail.highestBidder.toLowerCase() === walletAddress.toLowerCase()
            : false;
        const highestBid = ethers.utils.formatUnits(detail.highestBid, 18);
        const highestBidder = detail.highestBidder;

        let category = "";
        if (nft.attributes && Array.isArray(nft.attributes)) {
          const elementAttr = nft.attributes.find(
            (attr: any) => attr.trait_type === "Element"
          );
          if (elementAttr) {
            category = elementAttr.value;
          }
        }

        return {
          id: parseInt(nft.id),
          image: nft.image,
          title: nft.name,
          description: nft.description,
          attributes: nft.attributes,
          highestBid,
          highestBidder,
          category,
          altText: nft.name,
          endDate,
          isWinner,
          ended, // on-chain claimed flag
        };
      });

      const active = mergedNFTs.filter((nft) => new Date(nft.endDate) > now);
      const past = mergedNFTs
        .filter((nft) => new Date(nft.endDate) <= now)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      setActiveBids(active);
      setPastBids(past);
    } catch (error) {
      console.error("Error fetching NFT auction status:", error);
    }
  };

  const handleBidForNFT = async (nftId: number, bidValue: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      const graviChaAddress = deploymentConfig["GraviCha"];
      if (!graviPoolNFTAddress || !graviChaAddress) {
        throw new Error("Required contract addresses not found");
      }
      const graviCha = new ethers.Contract(graviChaAddress, GraviChaABI.abi, signer);
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      const parsedBidAmount = ethers.utils.parseUnits(bidValue, "ether");
      const approveTx = await graviCha.approve(graviPoolNFTAddress, parsedBidAmount);
      await approveTx.wait();
      const bidTx = await graviPoolNFT.bid(nftId, parsedBidAmount);
      await bidTx.wait();
      setPopupTitle("Bid Submitted Successfully");
      setPopupMsg(`Transaction hash:\n${bidTx.hash}`);
      setShowPopup(true);
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error placing bid:", error);
      setPopupTitle("Bid Failed");
      setPopupMsg((error as any)?.reason || (error as any)?.message || "Bid failed!");
      setShowPopup(true);
    }
  };

  const handleClaimNFT = async (nftId: number) => {
    if (!walletAddress) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviPoolNFTAddress) throw new Error("GraviPoolNFT address not found");
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      const claimTx = await graviPoolNFT.claimNFT(nftId);
      await claimTx.wait();
      setPopupTitle("NFT Claimed Successfully");
      setPopupMsg(`Transaction hash:\n${claimTx.hash}`);
      setShowPopup(true);
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setPopupTitle("Claim NFT Failed");
      setPopupMsg((error as any)?.reason || (error as any)?.message || "Claim NFT failed!");
      setShowPopup(true);
    }
  };

  const handleReclaimTokens = async (nftId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const response = await fetch("/addresses.json");
      const deploymentConfig = await response.json();
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];
      if (!graviPoolNFTAddress) throw new Error("GraviPoolNFT address not found");
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        signer
      );
      const tx = await graviPoolNFT.withdraw();
      await tx.wait();
      setPopupTitle("Tokens Reclaimed Successfully");
      setPopupMsg(`Recovered ${withdrawable} GraviCha tokens.\n\nTransaction hash:\n${tx.hash}`);
      setShowPopup(true);
      getNFTAuctionStatus();
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      setPopupTitle("Token Withdrawal Failed");
      setPopupMsg((error as any)?.reason || (error as any)?.message || "Token withdrawal failed!");
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getNFTAuctionStatus();
      const interval = setInterval(getNFTAuctionStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  return (
    <>
      <NavigationHeader />
    <main className="relative px-8 py-12 bg-white min-h-screen">
      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" />
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

      {/* <NavigationHeader /> */}

      <h1 className="relative text-5xl font-bold tracking-tight text-center text-gray-800 mb-8">
        NFT Auction
      </h1>


      <section className="flex flex-col gap-16 p-16 bg-white max-sm:gap-8 max-sm:p-6">
        {walletAddress ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Active Bids</h2>
            {activeBids.length > 0 ? (
              activeBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  currentUserAddress={walletAddress}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  auctionEnded={false}
                  auctionClaimed={nft.ended}
                  isWinner={nft.isWinner}
                  hasBid={true}
                  highestBid={nft.highestBid}
                  highestBidder={nft.highestBidder}
                  onBid={(bidValue: string) => handleBidForNFT(nft.id, bidValue)}
                  onClaimNFT={nft.isWinner ? () => handleClaimNFT(nft.id) : undefined}
                  onReclaimTokens={
                    !nft.isWinner ? () => handleReclaimTokens(nft.id) : undefined
                  }
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No active bids available.</p>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mt-12">Past Bids</h2>
            {pastBids.length > 0 ? (
              pastBids.map((nft) => (
                <NFTCard
                  key={nft.id}
                  currentUserAddress={walletAddress}
                  image={nft.image}
                  title={nft.title}
                  category={nft.category}
                  description={nft.description}
                  altText={nft.altText}
                  endDate={nft.endDate}
                  auctionEnded={true}
                  auctionClaimed={nft.ended}
                  isWinner={nft.isWinner}
                  hasBid={true}
                  highestBid={nft.highestBid}
                  highestBidder={nft.highestBidder}
                  onClaimNFT={nft.isWinner ? () => handleClaimNFT(nft.id) : undefined}
                  onReclaimTokens={
                    !nft.isWinner ? () => handleReclaimTokens(nft.id) : undefined
                  }
                  withdrawable={withdrawable}
                />
              ))
            ) : (
              <p className="text-lg text-gray-700">No past bids available.</p>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center pt-8">
            <article className="flex gap-6 items-start p-6 bg-white rounded-lg border border w-[588px] max-sm:w-full">
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
                    className="flex-1 gap-2 p-3 text-base leading-4 bg-gray-50 rounded-lg border border text-stone-900"
                  >
                    Connect your wallet
                  </button>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>
      {walletAddress && <DonorLeaderboard pastBids={pastBids} useMockData={false} />}
    </main>
    </>
  );
}
