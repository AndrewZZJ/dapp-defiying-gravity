import { ethers } from "hardhat";

import fs from "fs";
import path from "path";

// Helper function to read the deployment configuration file.
function loadDeploymentConfig(): Record<string, string> {
    const configPath = path.join(__dirname, ".", "metadata", "addresses.txt");
    if (!fs.existsSync(configPath)) {
        throw new Error(
        `Deployment config file not found at ${configPath}. Please run the initial deployment script first.`
        );
    }
    const fileData = fs.readFileSync(configPath, { encoding: "utf8" });
    const config: Record<string, string> = {};
    fileData.split("\n").forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.includes(":")) {
        const [key, value] = trimmedLine.split(":").map((part) => part.trim());
        config[key] = value;
        }
    });
    return config;
}

// Function to write deployment configuration to a file.
function writeDeploymentConfig(config: Record<string, string>): void {
    const outputDir = path.join(__dirname, ".", "metadata");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFile = path.join(outputDir, "addresses.txt");

    // Format the configuration as a string.
    const configContent = Object.entries(config)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    fs.writeFileSync(outputFile, configContent, { encoding: "utf8" });
    console.log("Deployment configuration written to:", outputFile);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deploying contracts with account:", deployerAddress);

    // Load existing deployment addresses from file.
    const deploymentConfig = loadDeploymentConfig();
    console.log("Loaded deployment configuration:", deploymentConfig);

    // Get the address of the GraviDao contract. And the instance of the contract.
    const graviDaoAddress = deploymentConfig["GraviDAO"];
    if (!graviDaoAddress) {
        throw new Error("GraviDAO address not found in deployment_config.txt");
    }
    const graviDAO = await ethers.getContractAt("GraviDAO", graviDaoAddress); 
    console.log("Using existing GraviDAO at:", graviDaoAddress);

    // Get the current number of GraviGov governance tokens of the deployer.
    const graviGovAddress = deploymentConfig["GraviGov"];
    if (!graviGovAddress) {
        throw new Error("GraviGov address not found in deployment_config.txt");
    }

    const graviGov = await ethers.getContractAt("IGraviGov", graviGovAddress);
    const deployerGraviGovBalance = await graviGov.balanceOf(deployerAddress);
    console.log("Deployer GraviGov balance:", deployerGraviGovBalance.toString());

    // View the current proposals in the DAO.
    // const createdProposal = graviDAO.filters.ProposalCreated()

    // // Get the current proposal count.
    // console.log("Current proposal count:", createdProposal);
    const events = await graviDAO.queryFilter(graviDAO.filters.ProposalCreated());

    const desiredDescription = "Add Flood Insurance and NFT Pool to DAO.";

    // Search for the desired proposal.
    let desiredProposal: typeof events[0] | undefined;
    for (const event of events) {
        if (event.args.description === desiredDescription) {
            desiredProposal = event;
            break;
        }
    }

    // If the desired proposal is not found, throw an error.
    if (!desiredProposal) {
        throw new Error("Desired proposal not found.");
    }

    // Get the proposal ID from the event. And print it.
    const proposalId = desiredProposal.args.proposalId;
    console.log("Desired proposal ID:", proposalId.toString());

    // Print the state of the proposal.
    let proposalState = await graviDAO.state(proposalId);
    console.log("Proposal state:", proposalState.toString());

    // Print the current block vs. the snapshot and deadline of the proposal.
    const snapshot = await graviDAO.proposalSnapshot(proposalId);
    const deadline = await graviDAO.proposalDeadline(proposalId);
    let currentBlock = await ethers.provider.getBlockNumber();
    console.log({ snapshot: snapshot.toString(), deadline: deadline.toString(), currentBlock });

    // Check the voting power of the deployer.
    currentBlock = await ethers.provider.getBlockNumber();
    let votes = await graviDAO.getVotes(deployerAddress, currentBlock - 1);
    console.log("Voting power:", votes.toString());

    // Cast a vote in favor of the proposal.
    console.log("Casting vote in favor of the proposal...");

    // Here, 1 represents a "For" vote.
    const voteTx = await graviDAO.castVote(proposalId, 1);
    await voteTx.wait();
    console.log("Vote cast successfully.");

    // -------------------------------
    // Simulate waiting for the voting period to end.
    // -------------------------------
    // If you are testing locally, increase the EVM time to simulate the end of the voting period.
    // (Adjust the number of seconds as needed based on your DAO’s voting period.)
    // await ethers.provider.send("evm_increaseTime", [60000]);
    await ethers.provider.send("hardhat_mine", ["0x2000"]); // mine 2*4096 blocks
    await ethers.provider.send("evm_mine");
    console.log("Voting period ended.");

    // Print the current block vs. the snapshot and deadline of the proposal.
    currentBlock = await ethers.provider.getBlockNumber();
    console.log({ snapshot: snapshot.toString(), deadline: deadline.toString(), currentBlock });

    // Check the state of the proposal (for example, state 4 might indicate "Succeeded").
    proposalState = await graviDAO.state(proposalId);
    console.log("Proposal state after voting period:", proposalState.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  