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
 * Simulates a time skip in the EVM. Also mines blocks for each 12-second interval skipped.
 * @param seconds - Number of seconds to skip.
 */
export async function simulateTimeSkip(seconds: number): Promise<void> {
  // Increase EVM time
  await ethers.provider.send("evm_increaseTime", [seconds]);

  // Calculate the number of blocks to mine based on a 12-second block time.
  const blocksToMine = Math.floor(seconds / 12);
  
  if (blocksToMine > 0) {
    // Mine the calculated number of blocks.
    await ethers.provider.send("hardhat_mine", [ethers.toQuantity(blocksToMine)]);
  } else {
    // If seconds is less than 12, mine one block to reflect the time skip.
    await ethers.provider.send("evm_mine", []);
  }

  console.log(`Simulated time skip of ${seconds} seconds (${blocksToMine} block(s) mined based on 12 seconds per block).`);
}


/**
 * Given a future block number, estimates the future timestamp.
 * It assumes each block takes ~12 seconds.
 * @param futureBlock - The future block number.
 * @returns An object containing the estimated UNIX timestamp and a formatted date-time string.
 */
export async function estimateFutureTimestamp(futureBlock: number): Promise<{ timestamp: number; formatted: string }> {
  // Get current block info
  const latestBlock = await ethers.provider.getBlock("latest");

  // Assert that the block is not null
  if (!latestBlock) {
    throw new Error("Latest block is null.");
  }

  // Ensure we work with numbers
  const currentBlockNumber = Number(latestBlock.number);
  const currentTimestamp = Number(latestBlock.timestamp);

  // Calculate the number of blocks until the future block and estimate the time offset
  const blocksToWait = futureBlock - currentBlockNumber;
  if (blocksToWait < 0) {
    throw new Error("Future block must be greater than the current block number.");
  }

  // Using 12 seconds per block as the average block time
  const estimatedSeconds = blocksToWait * 12;
  const futureTimestamp = currentTimestamp + estimatedSeconds;
  const formattedDateTime = new Date(futureTimestamp * 1000).toLocaleString();

  return { timestamp: futureTimestamp, formatted: formattedDateTime };
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

// /**
//  * Prints proposal voting info: start block (snapshot), deadline, and current block.
//  * @param dao - The DAO contract instance.
//  * @param proposalId - The ID of the proposal.
//  */
// export async function printProposalInfo(
//   dao: any,
//   proposalId: any
// ): Promise<void> {
//   const proposalState = await dao.state(proposalId);
//   const snapshot = await dao.proposalSnapshot(proposalId);
//   const deadline = await dao.proposalDeadline(proposalId);
//   const currentBlock = await ethers.provider.getBlockNumber();
//   console.log({
//     proposalState: proposalState.toString(),
//     snapshot: snapshot.toString(),
//     deadline: deadline.toString(),
//     currentBlock,
//   });
// }

/**
 * Prints proposal voting info: start block (snapshot), deadline, and current block,
 * along with their corresponding timestamps and formatted date-time strings.
 * @param dao - The DAO contract instance.
 * @param proposalId - The ID of the proposal.
 */
export async function printProposalInfo(
  dao: any,
  proposalId: any
): Promise<void> {
  const proposalState = await dao.state(proposalId);
  // Convert snapshot and deadline to numbers in case they're BigNumber
  const snapshot = Number(await dao.proposalSnapshot(proposalId));
  const deadline = Number(await dao.proposalDeadline(proposalId));
  const currentBlockNumber = await ethers.provider.getBlockNumber();

  // Function to get time info for a block number.
  async function getTimeInfo(blockNumber: number) {
    // If block number is in the future, estimate using our function.
    if (blockNumber > currentBlockNumber) {
      return await estimateFutureTimestamp(blockNumber);
    } else {
      // Block is already mined, get actual block data.
      const block = await ethers.provider.getBlock(blockNumber);

      if (!block) {
        throw new Error("Block is null.");
      }

      return {
        timestamp: Number(block.timestamp),
        formatted: new Date(Number(block.timestamp) * 1000).toLocaleString()
      };
    }
  }

  const snapshotTimeInfo = await getTimeInfo(snapshot);
  const deadlineTimeInfo = await getTimeInfo(deadline);

  // Get current block time info from the latest mined block.
  const currentBlock = await ethers.provider.getBlock(currentBlockNumber);

  if (!currentBlock) {
    throw new Error("Current block is null.");
  }

  const currentTimeInfo = {
    timestamp: Number(currentBlock.timestamp),
    formatted: new Date(Number(currentBlock.timestamp) * 1000).toLocaleString()
  };

  console.log({
    proposalState: proposalState.toString(),
    currentBlock: currentBlockNumber,
    currentBlockTimestamp: currentTimeInfo.timestamp,
    currentBlockDateTime: currentTimeInfo.formatted,
    snapshot: snapshot.toString(),
    snapshotTimestamp: snapshotTimeInfo.timestamp,
    snapshotDateTime: snapshotTimeInfo.formatted,
    deadline: deadline.toString(),
    deadlineTimestamp: deadlineTimeInfo.timestamp,
    deadlineDateTime: deadlineTimeInfo.formatted,
  });
}