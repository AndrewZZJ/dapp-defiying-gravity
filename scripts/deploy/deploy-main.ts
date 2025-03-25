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
  const mintAmount = 1000000; // Adjust mint amount as needed.
  const mintTx = await graviGov.mint(deployerAddress, mintAmount);
  await mintTx.wait();
  const govBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Deployer GraviGov balance:", govBalance.toString());

  // Deploy TimelockController.
  const minDelay = 0;
  const proposers: string[] = [];
  const executors: string[] = [];
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(minDelay, proposers, executors, deployerAddress);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("TimelockController deployed at:", timelockAddress);

  // Deploy GraviDAO.
  const GraviDAO = await ethers.getContractFactory("GraviDAO");
  const graviDAO = await GraviDAO.deploy(graviChaAddress, graviGovAddress, graviGovAddress, timelockAddress);
  await graviDAO.waitForDeployment();
  const graviDAOAddress = await graviDAO.getAddress();
  console.log("GraviDAO deployed at:", graviDAOAddress);

  // Grant required roles in Timelock to GraviDAO.
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, graviDAOAddress);
  await timelock.grantRole(EXECUTOR_ROLE, graviDAOAddress);

  // Grant minting roles and transfer ownership for tokens.
  await graviCha.addMinter(graviDAOAddress);
  await graviCha.addMinter(graviGovAddress);
  await graviCha.transferOwnership(graviDAOAddress);
  await graviGov.transferOwnership(graviDAOAddress);

  // Print deployer's voting power.
  const currentBlock = await ethers.provider.getBlockNumber();
  // The getVotes function uses the snapshot from the previous block.
  const votingPower = await graviDAO.getVotes(deployerAddress, currentBlock - 1);
  console.log("Voting power of deployer:", votingPower.toString());

  // Save core deployments.
  writeDeploymentConfig({
    GraviCha: graviChaAddress,
    GraviGov: graviGovAddress,
    TimelockController: timelockAddress,
    GraviDAO: graviDAOAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});