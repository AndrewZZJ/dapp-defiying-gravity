"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";

const contractAddress = "0xYourContractAddress"; // replace with real one
const contractABI = [
  "function getGovPoolBalance() public view returns (uint256)",
  "function getExchangeRate() public view returns (uint256, uint256)",
  "function swapGov(uint256 amount) public",
  "function burnGov(uint256 amount) public",
];

export const SwapForm: React.FC = () => {
  const { walletAddress } = useWallet();
  const [govAmount, setGovAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState({ eth: 0, graviCha: 0 });
  const [govPoolBalance, setGovPoolBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoolData = async () => {
    if (!walletAddress || !window.ethereum) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const [ethRate, graviChaRate] = await contract.getExchangeRate();
      const poolBalance = await contract.getGovPoolBalance();

      setExchangeRate({
        eth: parseFloat(ethers.utils.formatEther(ethRate)),
        graviCha: parseFloat(graviChaRate.toString()),
      });
      setGovPoolBalance(parseFloat(ethers.utils.formatEther(poolBalance)));
    } catch (err) {
      console.error("Failed to fetch pool data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, [walletAddress]);

  const handleGovSwap = async () => {
    const amount = Number(govAmount);
    if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid GOV amount.");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.swapGov(ethers.utils.parseEther(govAmount));
      await tx.wait();

      alert("Swap successful!");
      setGovAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check console.");
    }
  };

  const handleGovBurn = async () => {
    const amount = Number(burnAmount);
    if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid amount to return to pool.");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.burnGov(ethers.utils.parseEther(burnAmount));
      await tx.wait();

      alert("Return to pool successful!");
      setBurnAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Return to pool failed:", err);
      alert("Return to pool failed. Check console.");
    }
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-xl text-black">
      <h2 className="text-2xl font-semibold mb-4">Purchase GraviGov from Pool</h2>

      <label className="block mb-2 font-medium">Amount of GraviGov:</label>
      <input
        type="number"
        value={govAmount}
        onChange={(e) => setGovAmount(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter amount"
      />

      <p className="text-sm mb-2">
        You will spend:
        <br />• <strong>{Number(govAmount) * exchangeRate.eth || 0} ETH</strong>
        <br />• <strong>{Number(govAmount) * exchangeRate.graviCha || 0} GraviCha</strong>
      </p>

      <button
        onClick={handleGovSwap}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Purchase
      </button>

      <hr className="my-8" />

      <h2 className="text-2xl font-semibold mb-4">Return GraviGov to pool for GraviCha</h2>

      <label className="block mb-2 font-medium">Amount to return to pool:</label>
      <input
        type="number"
        value={burnAmount}
        onChange={(e) => setBurnAmount(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter amount"
      />

      <p className="text-sm mb-2">
        You’ll mint: <strong>{Number(burnAmount) || 0} GraviCha</strong>
      </p>

      <button
        onClick={handleGovBurn}
        className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Return GOV to pool for GraviCha
      </button>

      <div className="mt-8 text-sm text-gray-700">
        {loading ? (
          <p>Loading pool data...</p>
        ) : (
          <>
            <p>
              <strong>Exchange Rate:</strong> 1 GOV = {exchangeRate.eth} ETH +{" "}
              {exchangeRate.graviCha} GraviCha
            </p>
            <p>
              <strong>GOV Pool Balance:</strong>{" "}
              {govPoolBalance !== null ? govPoolBalance.toLocaleString() : "--"} GOV
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// "use client";

// import React, { useState, useEffect } from "react";

// export const SwapForm: React.FC = () => {
//   const [govAmount, setGovAmount] = useState("");
//   const [burnAmount, setBurnAmount] = useState("");
//   const [exchangeRate, setExchangeRate] = useState({ eth: 0.01, graviCha: 5 }); // Mock rates
//   const [govPoolBalance, setGovPoolBalance] = useState(100000); // Mock pool

//   const govAmountNum = Number(govAmount);
//   const handleGovSwap = () => {
//     // Submit swap transaction here
//     alert(
//         `Swap ${govAmountNum} GOV for ${govAmountNum * exchangeRate.eth} ETH and ${govAmountNum * exchangeRate.graviCha} GraviCha`
//       );
//   };

//   const handleGovBurn = () => {
//     // Submit burn transaction here
//     alert(`Burn ${burnAmount} GOV to mint ${burnAmount} GraviCha`);
//   };

//   return (
//     <div className="bg-white rounded-lg p-8 shadow-xl text-black">
//       <h2 className="text-2xl font-semibold mb-4">Swap GraviGov for ETH + GraviCha</h2>

//       <label className="block mb-2 font-medium">Amount of GraviGov:</label>
//       <input
//         type="number"
//         value={govAmount}
//         onChange={(e) => setGovAmount(e.target.value)}
//         className="w-full p-2 border border-gray-300 rounded mb-4"
//         placeholder="Enter amount"
//       />

//         <p className="text-sm mb-2">
//             You'll receive:
//             <br />• <strong>{Number(govAmount) * exchangeRate.eth || 0} ETH</strong>
//             <br />• <strong>{Number(govAmount) * exchangeRate.graviCha || 0} GraviCha</strong>
//             </p>


//       <button
//         onClick={handleGovSwap}
//         className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
//       >
//         Swap
//       </button>

//       <hr className="my-8" />

//       <h2 className="text-2xl font-semibold mb-4">Burn GraviGov for GraviCha</h2>

//       <label className="block mb-2 font-medium">Amount to Burn:</label>
//       <input
//         type="number"
//         value={burnAmount}
//         onChange={(e) => setBurnAmount(e.target.value)}
//         className="w-full p-2 border border-gray-300 rounded mb-4"
//         placeholder="Enter amount"
//       />

//       <p className="text-sm mb-2">
//         You’ll mint: <strong>{burnAmount || 0} GraviCha</strong>
//       </p>

//       <button
//         onClick={handleGovBurn}
//         className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
//       >
//         Burn GOV for GraviCha
//       </button>

//       <div className="mt-8 text-sm text-gray-700">
//         <p><strong>Exchange Rate:</strong> 1 GOV = {exchangeRate.eth} ETH + {exchangeRate.graviCha} GraviCha</p>
//         <p><strong>GOV Pool Balance:</strong> {govPoolBalance.toLocaleString()} GOV</p>
//       </div>
//     </div>
//   );
// };
