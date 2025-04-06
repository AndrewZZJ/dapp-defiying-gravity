import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";

interface WalletInfo {
  graviGovTokens: number;
  graviChaTokens: number;
  ownedNFTs: { id: string; name: string; image: string }[];
}

export const Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  const fetchWalletInfo = async (address: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Fetch deployment config from public/addresses.json
      const response = await fetch("/addresses.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses.json: ${response.statusText}`);
      }
      const deploymentConfig = await response.json();

      const graviGovAddress = deploymentConfig["GraviGov"];
      const graviChaAddress = deploymentConfig["GraviCha"];

      if (!graviGovAddress || !graviChaAddress) {
        throw new Error("Required addresses (GraviGov or GraviCha) not found in addresses.json.");
      }

      console.log("Wallet Address:", address);
      console.log("GraviGov Address:", graviGovAddress);
      console.log("GraviCha Address:", graviChaAddress);

      // Get the GraviGov contract instance using the full ABI
      const graviGov = new ethers.Contract(graviGovAddress, GraviGovABI.abi, provider);

      // Get the GraviCha contract instance using the full ABI
      const graviCha = new ethers.Contract(graviChaAddress, GraviChaABI.abi, provider);

      // Fetch balances
      const govBalance = await graviGov.balanceOf(address);
      const chaBalance = await graviCha.balanceOf(address);

      console.log("Raw GraviGov Balance:", govBalance.toString());
      console.log("Raw GraviCha Balance:", chaBalance.toString());

      // Convert balances to Ether format
      const graviGovTokens = parseFloat(ethers.utils.formatEther(govBalance));
      const graviChaTokens = parseFloat(ethers.utils.formatEther(chaBalance));

      console.log("Formatted GraviGov Tokens:", graviGovTokens);
      console.log("Formatted GraviCha Tokens:", graviChaTokens);

      // Mock NFT data (replace with actual backend call if needed)
      const ownedNFTs = [
        {
          id: "1",
          name: "Fire NFT",
          image:
            "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
        },
        {
          id: "2",
          name: "Earthquake NFT",
          image:
            "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
        },
      ];

      return {
        graviGovTokens,
        graviChaTokens,
        ownedNFTs,
      };
    } catch (error) {
      console.error("Failed to fetch wallet info:", error);
      return {
        graviGovTokens: 0,
        graviChaTokens: 0,
        ownedNFTs: [],
      };
    }
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Fetch wallet info from the blockchain
        const walletData = await fetchWalletInfo(address);
        setWalletInfo(walletData);
      }
    };

    fetchWalletDetails();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {walletAddress ? (
        <div>
          <p>
            <strong>Wallet Address:</strong> {walletAddress}
          </p>
          {walletInfo ? (
            <div className="mt-4">
              <p>
                <strong>GraviGov Tokens:</strong> {walletInfo.graviGovTokens}
              </p>
              <p>
                <strong>GraviCha Tokens:</strong> {walletInfo.graviChaTokens}
              </p>
              <div className="mt-4">
                <h2 className="text-xl font-bold">Owned NFTs:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {walletInfo.ownedNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className="p-4 bg-white rounded-lg shadow border"
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <p className="mt-2 text-center font-medium">{nft.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Loading wallet information...</p>
          )}
        </div>
      ) : (
        <p>Please connect your wallet to view dashboard details.</p>
      )}
    </div>
  );
};