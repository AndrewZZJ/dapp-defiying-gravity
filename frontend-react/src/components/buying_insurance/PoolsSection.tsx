"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext"; // Import WalletContext

interface PoolItemProps {
  title: string;
  purchased: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onPurchase: () => void;
  color: string;
}

const PoolItem: React.FC<PoolItemProps> = ({ title, purchased, isOpen, onToggle, onPurchase, color }) => {
  return (
    <div
      className={`border border-zinc-300 rounded-lg shadow-sm ${
        purchased ? `${color} text-white` : "bg-white"
      }`}
    >
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full p-4 text-left ${
          purchased ? "text-white" : "text-black"
        }`}
      >
        <div className="text-lg font-medium">
          {title} {purchased && <span>(Purchased)</span>}
        </div>
      </button>

      {isOpen && (
        <div className={`px-4 pb-4 text-sm ${purchased ? "text-white" : "text-zinc-700"}`}>
          <p>Purchase insurance against {title.toLowerCase()}s.</p>
          <button
            onClick={onPurchase}
            className="mt-2 px-4 py-2 text-white bg-green-700 rounded-lg hover:bg-green-800"
          >
            Buy
          </button>
        </div>
      )}
    </div>
  );
};

export const PoolsSection: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const { walletAddress } = useWallet(); // Access wallet state from context

  const contractAddress = "0xYourContractAddress"; // Replace with your contract address
  const contractABI = [
    "function buyInsurance(string poolName) public payable",
    "function getInsurancePools() public view returns (tuple(string name, string color)[])",
  ];

  const handleToggle = (item: string) => {
    setSelected(selected === item ? null : item);
  };

  const handlePurchase = async (item: string) => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the buyInsurance function on the smart contract
      const tx = await contract.buyInsurance(item, { value: ethers.utils.parseEther("0.1") }); // Replace "0.1" with the actual price
      await tx.wait();

      setPurchased([...purchased, item]);
      setShowPopup(true); // Show the popup
    } catch (error) {
      console.error("Failed to purchase insurance:", error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const poolItems = [
    { title: "Wildfire", color: "bg-orange-500" },
    { title: "Flood", color: "bg-blue-300" },
    { title: "Earthquake", color: "bg-tan-500" },
  ];

  return (
    <main className="relative px-0 py-3.5 bg-[color:var(--sds-color-background-default-secondary)] h-[782px]">
      <h1 className="mb-16 text-7xl font-bold text-center text-neutral-950 max-md:mb-10 max-md:text-5xl max-sm:mb-8 max-sm:text-4xl">
        Buy Insurance
      </h1>

      <section className="flex flex-col gap-6 p-16 mx-auto my-0 max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {poolItems.map((item) => (
          <PoolItem
            key={item.title}
            title={item.title}
            purchased={purchased.includes(item.title)}
            isOpen={selected === item.title}
            onToggle={() => handleToggle(item.title)}
            onPurchase={() => handlePurchase(item.title)}
            color={item.color}
          />
        ))}
      </section>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
          >
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-red-600 hover:text-white"
            >
              <span className="font-bold text-lg">X</span>
            </button>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-3xl font-bold text-center mb-4">Congratulations!</p>
              <p className="text-lg text-center">You have successfully purchased insurance.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
