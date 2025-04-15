"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";
import GraviPoolNFTABI from "../../artifacts/contracts/tokens/GraviPoolNFT.sol/GraviPoolNFT.json";

interface WalletInfo {
  graviGovTokens: number;
  graviChaTokens: number;
  ownedNFTs: { id: string; name: string; image: string }[];
}

export const Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  /* ---------------------------- helper functions --------------------------- */
  const addressEqual = (to: string, account: string): boolean =>
    to.toLowerCase() === account.toLowerCase();

  const getOwnerNFTs = async (
    graviPoolNFT: any,
    ownerAddress: string
  ): Promise<string[]> => {
    const sentLogs = await graviPoolNFT.queryFilter(
      graviPoolNFT.filters.Transfer(ownerAddress, undefined)
    );
    const receivedLogs = await graviPoolNFT.queryFilter(
      graviPoolNFT.filters.Transfer(undefined, ownerAddress)
    );

    const logs = sentLogs.concat(receivedLogs).sort(
      (
        a: { blockNumber: number; transactionIndex: number },
        b: { blockNumber: number; transactionIndex: number }
      ) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex
    );

    const owned = new Set<string>();
    for (const {
      args: { from, to, tokenId },
    } of logs as any[]) {
      if (addressEqual(to, ownerAddress)) {
        owned.add(tokenId.toString());
      } else if (addressEqual(from, ownerAddress)) {
        owned.delete(tokenId.toString());
      }
    }

    return Array.from(owned);
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
            image: nftJson.image,
          };
        })
      );
      return nftData;
    } catch (error) {
      console.error("Failed to fetch NFT data:", error);
      return [];
    }
  };

  const fetchWalletInfo = async (address: string): Promise<WalletInfo> => {
    try {
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );

      const response = await fetch("/addresses.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses.json: ${response.statusText}`);
      }
      const deploymentConfig = await response.json();

      const graviGovAddress = deploymentConfig["GraviGov"];
      const graviChaAddress = deploymentConfig["GraviCha"];
      const graviPoolNFTAddress = deploymentConfig["GraviPoolNFT"];

      const graviGov = new ethers.Contract(
        graviGovAddress,
        GraviGovABI.abi,
        provider
      );
      const graviCha = new ethers.Contract(
        graviChaAddress,
        GraviChaABI.abi,
        provider
      );
      const graviPoolNFT = new ethers.Contract(
        graviPoolNFTAddress,
        GraviPoolNFTABI.abi,
        provider
      );

      const [govBalance, chaBalance] = await Promise.all([
        graviGov.balanceOf(address),
        graviCha.balanceOf(address),
      ]);

      const graviGovTokens = parseFloat(ethers.utils.formatEther(govBalance));
      const graviChaTokens = parseFloat(ethers.utils.formatEther(chaBalance));

      const tokens = await getOwnerNFTs(graviPoolNFT, address);
      const tokenURIs = await Promise.all(
        tokens.map(async (tokenId: string) => {
          const tokenURI = await graviPoolNFT.tokenURI(tokenId);
          return { tokenId, tokenURI };
        })
      );
      const ownedNFTs = await fetchNFTData(tokenURIs);

      return { graviGovTokens, graviChaTokens, ownedNFTs };
    } catch (error) {
      console.error("Failed to fetch wallet info:", error);
      return { graviGovTokens: 0, graviChaTokens: 0, ownedNFTs: [] };
    }
  };

  /* ------------------------------- lifecycle ------------------------------- */
  useEffect(() => {
    const fetchWalletDetails = async () => {
      if ((window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setWalletInfo(null); // reset while loading
        const walletData = await fetchWalletInfo(address);
        setWalletInfo(walletData);
      }
    };

    fetchWalletDetails();
  }, []);

  // /* ---------------------------- logout handler ---------------------------- */
  // const handleLogout = () => {
  //   setWalletAddress(null);
  //   setWalletInfo(null);
  // };

  /* --------------------------------- render -------------------------------- */
/* --------------------------------- render -------------------------------- */
return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 mb-4">
          Dashboard
        </h1>
  
        {/* No wallet connected */}
        {!walletAddress && (
          <div className="max-w-lg bg-white rounded-lg shadow p-6 text-center mx-auto">
            <p className="text-gray-600">
              Please connect your wallet to view dashboard details.
            </p>
          </div>
        )}
  
        {/* Wallet connected */}
        {walletAddress && (
          <div className="space-y-6">
            {/* Wallet summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-xl font-semibold">Wallet</h2>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[50vw]">
                    {walletAddress}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Stat label="GraviGov Tokens" value={walletInfo?.graviGovTokens} />
                <Stat label="GraviCha Tokens" value={walletInfo?.graviChaTokens} />
              </div>
            </div>
  
            {/* NFTs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Owned NFTs</h2>
              {walletInfo ? (
                walletInfo.ownedNFTs.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {walletInfo.ownedNFTs.map((nft) => (
                      <div
                        key={nft.id}
                        className="rounded-lg overflow-hidden shadow-sm bg-gray-50 hover:shadow-md transition-shadow"
                      >
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-2 text-center">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {nft.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No NFTs found.</p>
                )
              ) : (
                <SkeletonGrid count={4} />
              )}
            </div>
          </div>
        )}
  
        {/* Global loader when wallet info is fetching */}
        {!walletInfo && walletAddress && (
          <div className="mt-6 flex items-center gap-2 text-gray-500 justify-center">
            <Loader className="h-5 w-5" />
            Loading wallet information...
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
// Small stat card helper
interface StatProps {
  label: string;
  value: number | undefined;
}

const Stat: React.FC<StatProps> = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-4 text-center shadow-sm">
    {value === undefined ? (
      <div className="h-6 w-24 mx-auto rounded animate-pulse bg-gray-200" />
    ) : (
      <p className="text-2xl font-semibold text-gray-800">
        {value.toLocaleString()}
      </p>
    )}
    <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{label}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
// Simple grid skeleton for loading state
const SkeletonGrid: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-48 w-full rounded-lg animate-pulse bg-gray-200"
      />
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
// Simple SVG spinner (no external deps)
const Loader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);
