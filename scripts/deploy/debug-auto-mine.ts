const { ethers } = require("hardhat");

async function main() {
  const [account] = await ethers.getSigners();
  const provider = ethers.provider;

  console.log("Mining every 12 seconds...");
  setInterval(async () => {
    console.log("Mining a new block...");
    await provider.send("evm_mine", []);
  }, 12000); // Mine a block every 12 seconds

  // Keep the script running to continue mining
  await new Promise(() => {});
}

main()
.catch((error) => {
console.error(error);
process.exitCode = 1;
});
