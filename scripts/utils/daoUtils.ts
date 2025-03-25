// scripts/utils/daoUtils.ts

import { ethers } from "hardhat";

/**
 * Creates a proposal on the DAO.
 * @param dao - The DAO contract instance.
 * @param targets - Array of target addresses.
 * @param values - Array of ETH values (in wei).
 * @param calldatas - Array of encoded function calls.
 * @param description - Proposal description.
 * @returns The proposalId.
 */
export async function createProposal(
  dao: any,
  targets: string[],
  values: number[],
  calldatas: any[],
  description: string
): Promise<any> {
  const tx = await dao.propose(targets, values, calldatas, description);
  const receipt = await tx.wait();
  // Search for the ProposalCreated event and return its proposalId.
  const events = await dao.queryFilter(dao.filters.ProposalCreated());
  const proposal = events.find((e: any) => e.args.description === description);
  if (!proposal) {
    throw new Error("Proposal not found in events.");
  }
  return proposal.args.proposalId;
}

/**
 * Casts a vote on a proposal.
 * @param dao - The DAO contract instance.
 * @param proposalId - The ID of the proposal.
 * @param vote - Vote value (e.g., 1 for “For”).
 */
export async function voteOnProposal(
  dao: any,
  proposalId: any,
  vote: number
): Promise<void> {
  const tx = await dao.castVote(proposalId, vote);
  await tx.wait();
  console.log(`Vote cast on proposal ${proposalId.toString()}`);
}

/**
 * Queues the proposal.
 * @param dao - The DAO contract instance.
 * @param targets - Array of target addresses.
 * @param values - Array of ETH values (in wei).
 * @param calldatas - Array of encoded function calls.
 * @param description - Proposal description.
 * @returns The description hash.
 */
export async function queueProposal(
  dao: any,
  targets: string[],
  values: number[],
  calldatas: any[],
  description: string
): Promise<string> {
  const descriptionHash = ethers.id(description);
  const tx = await dao.queue(targets, values, calldatas, descriptionHash);
  await tx.wait();
  console.log("Proposal queued.");
  return descriptionHash;
}

/**
 * Simulates a time skip in the EVM. Also mines a block for each second skipped.
 * @param seconds - Number of seconds to skip.
 */
export async function simulateTimeSkip(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
    //   await ethers.provider.send("evm_mine", []);
    // Mine blocks based on the number of seconds skipped (1 block per second).
  await ethers.provider.send("hardhat_mine", [ethers.toQuantity(seconds)]);

  console.log(`Simulated time skip of ${seconds} seconds.`);
}

/**
 * Executes a queued proposal.
 * @param dao - The DAO contract instance.
 * @param targets - Array of target addresses.
 * @param values - Array of ETH values (in wei).
 * @param calldatas - Array of encoded function calls.
 * @param descriptionHash - The hash of the proposal description.
 */
export async function executeProposal(
  dao: any,
  targets: string[],
  values: number[],
  calldatas: any[],
  descriptionHash: string
): Promise<void> {
  const tx = await dao.execute(targets, values, calldatas, descriptionHash);
  await tx.wait();
  console.log("Proposal executed successfully.");
}

/**
 * Prints proposal voting info: start block (snapshot), deadline, and current block.
 * @param dao - The DAO contract instance.
 * @param proposalId - The ID of the proposal.
 */
export async function printProposalInfo(
  dao: any,
  proposalId: any
): Promise<void> {
  const proposalState = await dao.state(proposalId);
  const snapshot = await dao.proposalSnapshot(proposalId);
  const deadline = await dao.proposalDeadline(proposalId);
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log({
    proposalState: proposalState.toString(),
    snapshot: snapshot.toString(),
    deadline: deadline.toString(),
    currentBlock,
  });
}