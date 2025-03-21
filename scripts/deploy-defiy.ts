const { ethers } = require("hardhat");

// from chatgpt
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy GraviCha token (ERC20)
  const GraviCha = await ethers.getContractFactory("GraviCha");
  const graviCha = await GraviCha.deploy();
  await graviCha.deployed();
  console.log("GraviCha deployed at:", graviCha.address);

  // 2. Deploy GraviPoolNFT (ERC721)
  const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
  const graviPoolNFT = await GraviPoolNFT.deploy(deployer.address, graviCha.address);
  await graviPoolNFT.deployed();
  console.log("GraviPoolNFT deployed at:", graviPoolNFT.address);

  // 3. Deploy InsuranceManager
  const InsuranceManager = await ethers.getContractFactory("InsuranceManager");
  const insuranceManager = await InsuranceManager.deploy(graviCha.address, graviPoolNFT.address);
  await insuranceManager.deployed();
  console.log("InsuranceManager deployed at:", insuranceManager.address);

  // 4. Add InsuranceManager as minter in GraviCha
  let tx = await graviCha.addMinter(insuranceManager.address);
  await tx.wait();
  console.log("InsuranceManager added as GraviCha minter");

  // 5. Create an InsurancePool via manager
  const disasterType = "Flood";
  const premiumRate = 5;
  tx = await insuranceManager.createInsurancePool(disasterType, premiumRate);
  await tx.wait();
  console.log(`InsurancePool for '${disasterType}' created`);

  const poolAddress = await insuranceManager.getPoolAddress(disasterType);
  console.log(`InsurancePool address: ${poolAddress}`);

  // 6. Mint NFT to the InsurancePool from deployer
  const floodTokenURI = "ipfs://QmYourFloodMetadataHash"; // Replace with actual IPFS URI
  tx = await graviPoolNFT.mintToPool(poolAddress, floodTokenURI);
  await tx.wait();
  console.log("NFT minted to InsurancePool");

  console.log("Deployment complete.");
  console.log("Deployed Contracts:");
  console.log("- GraviCha:", graviCha.address);
  console.log("- GraviPoolNFT:", graviPoolNFT.address);
  console.log("- InsuranceManager:", insuranceManager.address);
  console.log("- InsurancePool (Flood):", poolAddress);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
