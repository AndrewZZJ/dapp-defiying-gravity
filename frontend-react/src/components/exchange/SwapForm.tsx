"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import GraviGovABI from "../../artifacts/contracts/tokens/GraviGov.sol/GraviGov.json";
import GraviChaABI from "../../artifacts/contracts/tokens/GraviCha.sol/GraviCha.json";
import GraviDAOABI from "../../artifacts/contracts/GraviDAO.sol/GraviDAO.json";


// const contractAddress = "0xYourContractAddress"; // replace with real one
// const contractABI = [
//   "function calculatesGovTokenPurchasePrice(uint256 amount) public view returns (uint256, uint256)",
//   "function swapGov(uint256 amount) public",
//   "function burnGov(uint256 amount) public"
// ];
// const contractABI = [
//   "function getGovPoolBalance() public view returns (uint256)",
//   "function getExchangeRate() public view returns (uint256, uint256)",
//   "function swapGov(uint256 amount) public",
//   "function burnGov(uint256 amount) public",
// ];

export const SwapForm: React.FC = () => {
  const { walletAddress } = useWallet();
  const [govAmount, setGovAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState({ eth: 0, graviCha: 0 });
  const [govPoolBalance, setGovPoolBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [graviGovAddress, setGraviGovAddress] = useState<string>("");
  const [graviDaoAddress, setGraviDaoAddress] = useState<string>("");
  const [graviChaAddress, setGraviChaAddress] = useState<string>("");


  const fetchPoolData = async () => {
    if (!walletAddress || !window.ethereum) return;

    try {
      // const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      // const signer = provider.getSigner();
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const response = await fetch("/addresses.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses.json: ${response.statusText}`);
      }

      const deploymentConfig = await response.json();
      const govAddr = deploymentConfig["GraviGov"];
      const daoAddr = deploymentConfig["GraviDAO"];
      const chaAddr = deploymentConfig["GraviCha"];
      if (!govAddr || !daoAddr || !chaAddr) {
        throw new Error("Required addresses not found in addresses.json.");
      }

      setGraviGovAddress(govAddr);
      setGraviDaoAddress(daoAddr);
      setGraviChaAddress(chaAddr);

      // const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      // address = govAddr;

      // const graviGov = new ethers.Contract(govAddr, GraviGovABI.abi, provider);
      const graviDAO = new ethers.Contract(daoAddr, GraviDAOABI.abi, provider);
      // Get the GraviGov contract instance using the full ABI
      const graviGov = new ethers.Contract(govAddr, GraviGovABI.abi, provider);

      const burnToMintAmount = await graviGov.getCharityTokenExchangeRate();
      console.log("Burn to Mint Amount: ", burnToMintAmount.toString());
      setMintAmount(burnToMintAmount);

      // const govBalance = await graviGov.balanceOf(address);
      // const graviGovTokens = parseFloat(ethers.utils.formatEther(govBalance));
      // console.log("Gov Balance: ", graviGovTokens);
      // setGovPoolBalance(graviGovTokens);

      const poolBalance = await graviGov.balanceOf(daoAddr);
      const DAOgraviGovTokens = parseFloat(ethers.utils.formatEther(poolBalance));
      console.log("Gov Balance: ", DAOgraviGovTokens);
      console.log("DAO Address: ", daoAddr);
      setGovPoolBalance(parseFloat(ethers.utils.formatEther(poolBalance)));
      

      const [ethRate, graviChaRate] = await graviDAO.calculatesGovTokenPurchasePrice(1);
      setExchangeRate({
        eth: parseFloat(ethers.utils.formatEther(ethRate)),
        graviCha: parseFloat(ethers.utils.formatEther(graviChaRate)),
      });
      // setLoading(true);
      // const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      // const signer = provider.getSigner();
      // const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // const [ethRate, graviChaRate] = await contract.getExchangeRate();
      // const poolBalance = await contract.getGovPoolBalance();

      // setExchangeRate({
      //   eth: parseFloat(ethers.utils.formatEther(ethRate)),
      //   graviCha: parseFloat(graviChaRate.toString()),
      // });
      // setGovPoolBalance(parseFloat(ethers.utils.formatEther(poolBalance)));
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
      console.log("Gov Amount: ", govAmount);

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const graviDAO = new ethers.Contract(graviDaoAddress, GraviDAOABI.abi, signer);
      const graviCha = new ethers.Contract(graviChaAddress, GraviChaABI.abi, signer);
      
      const [ethPrice, graviChaBurn] = await graviDAO.calculatesGovTokenPurchasePrice(amount);
      console.log("ETH Price:", ethPrice.toString());
      console.log("GraviCha Burn:", graviChaBurn.toString());


      const currentAllowance = await graviCha.allowance(walletAddress, graviDaoAddress);

      // Print the current allowance
      console.log("Current allowance:", ethers.utils.formatEther(currentAllowance));
      console.log("GraviCha burn amount:", ethers.utils.formatEther(graviChaBurn));
      console.log("Wallet Address:", walletAddress);

      if (currentAllowance.lt(graviChaBurn)) {
        console.log("Allowance is less than burn amount. Approving...");
        const approveTx = await graviCha.approve(graviDaoAddress, graviChaBurn);
        await approveTx.wait();
      }

      console.log("Allowance is sufficient or approved.");
      console.log("Purchasing tokens...");

      const purchaseTx = await graviDAO.purchaseGovTokens(ethers.utils.parseEther(govAmount), { value: ethPrice.toString() });
      await purchaseTx.wait();
  
      alert("Swap successful!");
      setGovAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check console.");
    }
  };
  
  // const handleGovSwap = async () => {
  //   const amount = Number(govAmount);
  //   if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid GOV amount.");

  //   try {
  //     const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  //     const signer = provider.getSigner();
  //     const contract = new ethers.Contract(contractAddress, contractABI, signer);

  //     const tx = await contract.swapGov(ethers.utils.parseEther(govAmount));
  //     await tx.wait();

  //     alert("Swap successful!");
  //     setGovAmount("");
  //     fetchPoolData();
  //   } catch (err) {
  //     console.error("Swap failed:", err);
  //     alert("Swap failed. Check console.");
  //   }
  // };

  const handleGovBurn = async () => {
    const amount = Number(burnAmount);
    if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid amount to return to pool.");
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      // const dao = new ethers.Contract(graviDaoAddress, contractABI, signer);
      const graviGov = new ethers.Contract(graviGovAddress, GraviGovABI.abi, signer);
  
      const tx = await graviGov.convertToCharityTokens(ethers.utils.parseEther(burnAmount));
      await tx.wait();
  
      alert("Return to pool successful!");
      setBurnAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Return to pool failed:", err);
      alert("Return to pool failed. Check console.");
    }
  };  

  // const handleGovBurn = async () => {
  //   const amount = Number(burnAmount);
  //   if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid amount to return to pool.");

  //   try {
  //     const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  //     const signer = provider.getSigner();
  //     const contract = new ethers.Contract(contractAddress, contractABI, signer);

  //     const tx = await contract.burnGov(ethers.utils.parseEther(burnAmount));
  //     await tx.wait();

  //     alert("Return to pool successful!");
  //     setBurnAmount("");
  //     fetchPoolData();
  //   } catch (err) {
  //     console.error("Return to pool failed:", err);
  //     alert("Return to pool failed. Check console.");
  //   }
  // };

  return (
    <div className="bg-white rounded-lg p-8 shadow-xl text-black">
      <h2 className="text-2xl font-semibold mb-4">Purchase GraviGov from Pool</h2>

      {/* Display Pool Balance */}
      <p className="text-sm mb-4">
        <strong>Available in Pool:</strong>{" "}
        {govPoolBalance !== null ? `${govPoolBalance.toLocaleString()} GOV` : "Loading..."}
      </p>

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

      {/* <h2 className="text-2xl font-semibold mb-4">Return GraviGov to pool for GraviCha</h2>

      <label className="block mb-2 font-medium">Amount to return to pool:</label>
      <input
        type="number"
        value={burnAmount}
        onChange={(e) => setBurnAmount(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter amount"
      />

      <p className="text-sm mb-2">
        You’ll mint: <strong>{Number(burnAmount) * Number(mintAmount) || 0} GraviCha</strong>
      </p>

      <button
        onClick={handleGovBurn}
        className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Return GOV to pool for GraviCha
      </button> */}

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
