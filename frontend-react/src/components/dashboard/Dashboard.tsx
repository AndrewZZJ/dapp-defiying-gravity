import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

interface WalletInfo {
  graviGovTokens: number;
  graviChaTokens: number;
  ownedNFTs: { id: string; name: string; image: string }[];
}

export const Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  const fetchWalletInfo = async (address: string) => {
    // Replace this with an actual API call to backend
    const mockData: WalletInfo = {
      // AJ: backedn functions getting all wallet info - current number of GovTokens, ChaTokens, and owned NFTs.
      graviGovTokens: 1200,
      graviChaTokens: 450,
      ownedNFTs: [
        {
          id: "1",
          name: "Fire NFT",
          image: "https://cdn.builder.io/api/v1/image/assets/TEMP/804793bedaabda1cf9c4091b86cae6469cbe02c2",
        },
        {
          id: "2",
          name: "Earthquake NFT",
          image: "https://cdn.builder.io/api/v1/image/assets/TEMP/da420caf50e77f5a82cd88b049ac8d85fefa8be4",
        },
      ],
    };
    return mockData;
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Fetch wallet info from the backend
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