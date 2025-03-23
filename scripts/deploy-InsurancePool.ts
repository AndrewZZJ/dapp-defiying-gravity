// scripts/deployInsurancePool.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());

  // Deploy GraviCha token
  const GraviCha = await ethers.getContractFactory("GraviCha");
  const graviCha = await GraviCha.deploy();
  await graviCha.waitForDeployment();
  const graviChaAddress = await graviCha.getAddress();
  console.log("GraviCha deployed to:", graviChaAddress);

  // Deploy GraviPoolNFT (requires treasury address and GraviCha address as token)
  const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
  const graviPoolNFT = await GraviPoolNFT.deploy(deployer.address, graviChaAddress);
  await graviPoolNFT.waitForDeployment();
  const graviPoolNFTAddress = await graviPoolNFT.getAddress();
  console.log("GraviPoolNFT deployed to:", graviPoolNFTAddress);

  // Deploy GraviDAO (requires IVotes token and TimelockController)
  // For simplicity here we deploy a dummy TimelockController and use GraviCha as IVotes token
  const minDelay = 0;
  const proposers: string[] = [];
  const executors: string[] = [];

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(minDelay, proposers, executors, deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("TimelockController deployed to:", timelockAddress);

  const GraviDAO = await ethers.getContractFactory("GraviDAO");
  const graviDAO = await GraviDAO.deploy(graviChaAddress, graviPoolNFTAddress, graviChaAddress, timelockAddress);
  await graviDAO.waitForDeployment();
  const graviDAOAddress = await graviDAO.getAddress();
  console.log("GraviDAO deployed to:", graviDAOAddress);

  // Deploy GraviInsurance pool
  const disasterType = "Flood";
  const premiumRate = 5; // 5%

  const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
  const graviInsurance = await GraviInsurance.deploy(
    disasterType,
    premiumRate,
    graviChaAddress,
    graviPoolNFTAddress,
    graviDAOAddress
  );
  await graviInsurance.waitForDeployment();
  const graviInsuranceAddress = await graviInsurance.getAddress();
  console.log("GraviInsurance deployed to:", graviInsuranceAddress);

  // Optional: Give GraviInsurance permission to mint GraviCha and GraviPoolNFT
  await graviCha.addMinter(graviInsuranceAddress);
  await graviPoolNFT.transferOwnership(graviInsuranceAddress);
  console.log("GraviInsurance now owns GraviPoolNFT and is minter for GraviCha.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});