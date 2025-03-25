// scripts/dao/delegate-votes.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig } from "../utils/deploymentUtils";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Delegating votes for deployer:", deployerAddress);

  // Load deployment config to retrieve the GraviGov and GraviDAO addresses.
  const deploymentConfig = loadDeploymentConfig();
  const graviGovAddress = deploymentConfig["GraviGov"];
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  if (!graviGovAddress || !graviDAOAddress) {
    throw new Error("GraviGov or GraviDAO address not found in deployment config.");
  }

  // Get the GraviGov contract instance using the IGraviGov interface.
  const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);

  // Print deployer's current GraviGov token balance.
  const initialBalance = await graviGov.balanceOf(deployerAddress);
  console.log("Deployer GraviGov balance:", initialBalance.toString());

  // Optionally, check current voting power from the token (if implemented)
  let currentBlock = await ethers.provider.getBlockNumber();
  let tokenVotesBefore = await graviGov.getVotes(deployerAddress);
  console.log("Voting power (Token) before delegation:", tokenVotesBefore.toString());

  // Get the GraviDAO contract instance.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);
  let daoVotesBefore = await graviDAO.getVotes(deployerAddress, currentBlock - 1);
  console.log("Voting power (DAO) before delegation:", daoVotesBefore.toString());

  // Delegate the deployer's voting power to self.
  console.log("Delegating votes to self...");
  const delegateTx = await graviGov.delegate(deployerAddress);
  await delegateTx.wait();
  console.log("Delegation successful. Transaction hash:", delegateTx.hash);

  // Mine several blocks to update the delegation snapshot.
  for (let i = 0; i < 5; i++) {
    await ethers.provider.send("evm_mine", []);
  }

  // Check updated voting power.
  currentBlock = await ethers.provider.getBlockNumber();
  const tokenVotesAfter = await graviGov.getVotes(deployerAddress);
  console.log("Voting power (Token) after delegation:", tokenVotesAfter.toString());

  const daoVotesAfter = await graviDAO.getVotes(deployerAddress, currentBlock - 1);
  console.log("Voting power (DAO) after delegation:", daoVotesAfter.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});