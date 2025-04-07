// scripts/deploy/deploy-main.ts

import { ethers } from "hardhat";
import { writeDeploymentConfig } from "../utils/deploymentUtils";
import { clearMetadataFolder } from "../utils/clearMetadata";

async function main() {
  // Clear metadata folder when first running the deploy script.
  clearMetadataFolder();

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying core contracts with account:", deployerAddress);

  // Deploy GraviCha token.
  const GraviCha = await ethers.getContractFactory("GraviCha");
  const graviCha = await GraviCha.deploy();
  await graviCha.waitForDeployment();
  const graviChaAddress = await graviCha.getAddress();
  console.log("GraviCha deployed at:", graviChaAddress);

  // Deploy GraviGov token (with GraviCha address).
  const GraviGov = await ethers.getContractFactory("GraviGov");
  const graviGov = await GraviGov.deploy(graviChaAddress);
  await graviGov.waitForDeployment();
  const graviGovAddress = await graviGov.getAddress();
  console.log("GraviGov deployed at:", graviGovAddress);

  // Mint initial tokens.
  const mintAmount = ethers.parseEther("1000000"); // Adjust mint amount as needed.
  const mintTx = await graviGov.mint(deployerAddress, mintAmount);
  await mintTx.wait();
  const govBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Deployer GraviGov balance:", govBalance.toString());

  // // Also mint some to "0x65ef71Aa063cEcEB6569b9fdcd632952B2F141D9"
  // const mintTx2 = await graviGov.mint("0x65ef71Aa063cEcEB6569b9fdcd632952B2F141D9", mintAmount);
  // await mintTx2.wait();

  // Mint some charity tokens. (For testing purposes) for deployer.
  const charityMintAmount = ethers.parseEther("1000000"); // Adjust mint amount as needed.
  await graviCha.addMinter(deployerAddress);
  const charityMintTx = await graviCha.mint(deployerAddress, charityMintAmount);
  await charityMintTx.wait();

  // // Also mint some to "0x65ef71Aa063cEcEB6569b9fdcd632952B2F141D9"
  // const charityMintTx2 = await graviCha.mint("0x65ef71Aa063cEcEB6569b9fdcd632952B2F141D9", charityMintAmount);
  // await charityMintTx2.wait();

  const chaBalance = await graviCha.balanceOf(deployerAddress);
  await graviCha.removeMinter(deployerAddress);
  console.log("Deployer GraviCha balance:", chaBalance.toString());


  // Deploy TimelockController.
  const minDelay = 0;
  const proposers: string[] = [];
  const executors: string[] = [];
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(minDelay, proposers, executors, deployerAddress);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("TimelockController deployed at:", timelockAddress);

  // Deploy GraviGoverance.
  const GraviGovernance = await ethers.getContractFactory("GraviGovernance");
  const graviGovernance = await GraviGovernance.deploy(graviGovAddress, timelockAddress);
  await graviGovernance.waitForDeployment();
  const graviGovernanceAddress = await graviGovernance.getAddress();
  console.log("GraviGovernance deployed at:", graviGovernanceAddress);

  // Deploy GraviDAO.
  const GraviDAO = await ethers.getContractFactory("GraviDAO");
  const graviDAO = await GraviDAO.deploy(graviChaAddress, graviGovAddress);
  await graviDAO.waitForDeployment();
  const graviDAOAddress = await graviDAO.getAddress();
  console.log("GraviDAO deployed at:", graviDAOAddress);

  // Set the DAO in GraviGov to the GraviDAO address.
  const setDaoTx = await graviGov.setDAO(graviDAOAddress);
  await setDaoTx.wait();
  console.log("GraviGov DAO set to:", graviDAOAddress);

  // Grant required roles in Timelock to GraviGovernance.
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, graviGovernanceAddress);
  await timelock.grantRole(EXECUTOR_ROLE, graviGovernanceAddress);

  // Set the setTimelockController function in GraviDAO.
  const setTimelockTx = await graviDAO.setTimelockController(timelockAddress);
  await setTimelockTx.wait();
  console.log("GraviDAO TimelockController set to:", timelockAddress);

  // Grant minting roles and transfer ownership for tokens.
  await graviCha.addMinter(graviDAOAddress);
  await graviCha.addMinter(graviGovAddress);
  await graviCha.transferOwnership(graviDAOAddress);
  await graviGov.transferOwnership(graviDAOAddress);

  // Deploy GraviPoolNFT.
  const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
  const graviPoolNFT = await GraviPoolNFT.deploy(graviChaAddress);
  await graviPoolNFT.waitForDeployment();
  const graviPoolNFTAddress = await graviPoolNFT.getAddress();
  console.log(`GraviPoolNFT deployed at: ${graviPoolNFTAddress}`);
  
  // Transfer ownership of GraviPoolNFT to GraviDAO.
  await graviPoolNFT.transferOwnership(graviDAOAddress);
  console.log(`GraviPoolNFT ownership transferred to GraviDAO.`);

  // Set the NFT as the DAO nft pool.
  await graviDAO.setNFTPool(graviPoolNFTAddress);

  // Start an initial mint to governance pool.
  await graviDAO.monthlyMintGovTokens()

  // Print deployer's voting power.
  const currentBlock = await ethers.provider.getBlockNumber();
  // The getVotes function uses the snapshot from the previous block.
  const votingPower = await graviGovernance.getVotes(deployerAddress, currentBlock - 1);
  console.log("Voting power of deployer:", votingPower.toString());

  // Save core deployments.
  writeDeploymentConfig({
    GraviCha: graviChaAddress,
    GraviGov: graviGovAddress,
    TimelockController: timelockAddress,
    GraviDAO: graviDAOAddress,
    GraviGovernance: graviGovernanceAddress,
    GraviPoolNFT: graviPoolNFTAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});