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
  const [showPopup, setShowPopup] = useState(false); // State for success popup
  const [popupMessage, setPopupMessage] = useState(""); // State for popup message


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
    if (!amount || isNaN(amount) || amount <= 0) {
        setPopupMessage("Invalid Input\n\nPlease enter a valid amount greater than zero.");
        setShowPopup(true);
    return;
    }
  
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
  
      if (currentAllowance.lt(graviChaBurn)) {
        console.log("Allowance is less than burn amount. Approving...");
        const approveTx = await graviCha.approve(graviDaoAddress, graviChaBurn);
        await approveTx.wait();
      }
  
      console.log("Allowance is sufficient or approved.");
      console.log("Purchasing tokens...");
  
      const purchaseTx = await graviDAO.purchaseGovTokens(ethers.utils.parseEther(govAmount), { value: ethPrice.toString() });
      await purchaseTx.wait();
  
      // Show success popup
      setPopupMessage(`Purchase Successful\n\nPurchased ${govAmount} GraviGov tokens.\nThank you for your support!\n\nTransaction hash:\n${purchaseTx.hash}`);
      setShowPopup(true);
  
      setGovAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Swap failed:", err);
      setPopupMessage(`Transaction Failed\n\n${(err as any)?.reason || (err as any)?.message || "Please try again."}`);
      setShowPopup(true);
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
    if (!amount || isNaN(amount) || amount <= 0) {
        setPopupMessage("Invalid Input\n\nPlease enter a valid amount greater than zero.");
        setShowPopup(true);
        return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const graviGov = new ethers.Contract(graviGovAddress, GraviGovABI.abi, signer);
  
      const tx = await graviGov.convertToCharityTokens(ethers.utils.parseEther(burnAmount));
      await tx.wait();
  
      // Show success popup
      setPopupMessage(`Conversion Successful\n\nConverted ${burnAmount} GraviGov tokens to charity tokens.\nThank you for your support!\n\nTransaction hash:\n${tx.hash}`);
      setShowPopup(true);
  
      setBurnAmount("");
      fetchPoolData();
    } catch (err) {
      console.error("Return to pool failed:", err);
      setPopupMessage(`Transaction Failed\n\n${(err as any)?.reason || (err as any)?.message || "Please try again."}`);
      setShowPopup(true);
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
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 mb-6">
          Exchange GraviGov Tokens
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Purchase GraviGov Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Purchase GraviGov from Pool</h2>
              
              <div className="space-y-4">
                {/* Pool Balance Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Available in Pool</span>
                    <span className="text-sm font-medium text-gray-900">
                      {govPoolBalance !== null ? `${govPoolBalance.toLocaleString()} GOV` : "Loading..."}
                    </span>
                  </div>
                </div>
                
                {/* Input Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount of GraviGov
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      value={govAmount}
                      onChange={(e) => setGovAmount(e.target.value)}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">GOV</span>
                    </div>
                  </div>
                </div>
                
                {/* Cost Details */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">You will spend:</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">ETH</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(govAmount) * exchangeRate.eth || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">GraviCha</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(govAmount) * exchangeRate.graviCha || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50">
              <button
                onClick={handleGovSwap}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Purchase
              </button>
            </div>
          </section>
  
          {/* Exchange Details Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Exchange Information</h2>
              
              <div className="space-y-4">
                {/* Exchange Rate Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Exchange Rates</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">1 GOV costs</span>
                    <span className="text-sm font-medium text-gray-900">
                      {exchangeRate.eth} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">1 GOV costs</span>
                    <span className="text-sm font-medium text-gray-900">
                      {exchangeRate.graviCha} GraviCha
                    </span>
                  </div>
                </div>
                
                {/* GOV Pool Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pool Statistics</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">GraviGov Balance</span>
                    <span className="text-sm font-medium text-gray-900">
                      {govPoolBalance !== null ? govPoolBalance.toLocaleString() : "--"} GOV
                    </span>
                  </div>
                </div>
                
                {/* Exchange Description */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    GraviGov tokens grant you voting rights in the GraviTrust DAO. 
                    Each token represents one vote for proposals and governance decisions.
                  </p>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center p-4">
                    <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">Loading pool data...</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
        
        {/* This section can be uncommented if you want to add the burn functionality back */}
        {/* <div className="mt-8">
          <section className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Return GraviGov to pool for GraviCha</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to return to pool
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">GOV</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">You'll mint</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(burnAmount) * Number(mintAmount) || 0} GraviCha
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50">
              <button
                onClick={handleGovBurn}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Return GOV to pool for GraviCha
              </button>
            </div>
          </section>
        </div> */}
      </div>
      
      {/* Success Popup */}
        {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50" />
            <div
            className="relative bg-white text-black p-10 rounded-2xl shadow-2xl z-50"
            style={{ width: "600px", height: "300px" }}
            >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-3xl font-bold text-center">{popupMessage.split('\n')[0]}</p>
                <pre className="text-sm text-center break-all whitespace-pre-wrap">{popupMessage}</pre>
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
