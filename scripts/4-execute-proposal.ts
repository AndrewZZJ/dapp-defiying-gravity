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

    // -------------------------------
    // Queue the proposal.
    // -------------------------------
    console.log("Queueing the proposal...");
    const descriptionHash = ethers.id(desiredDescription);
    console.log("Description hash:", descriptionHash);

    // The description hash must match the one used in the propose step.
    const queueTx = await graviDAO.queue(
        [desiredProposal.args.targets[0]],
        [0],
        [desiredProposal.args.calldatas[0]],
        descriptionHash
    );
    await queueTx.wait();
    console.log("Proposal queued.");

    // -------------------------------
    // Execute the proposal.
    // -------------------------------
    // Increase time to pass the timelock delay (again, adjust as necessary).
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    console.log("Executing the proposal...");
    const executeTx = await graviDAO.execute(
        [desiredProposal.args.targets[0]],
        [0],
        [desiredProposal.args.calldatas[0]],
        descriptionHash
    );
    await executeTx.wait();
    console.log("Proposal executed successfully.");

    // Print the state of the proposal after execution.
    proposalState = await graviDAO.state(proposalId);
    console.log("Proposal state after execution:", proposalState.toString());

    // Wait a few blocks to allow the proposal to be finalized.
    for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
    }

    // Print the getAllInsurancePoolNames
    const insurancePoolNames = await graviDAO.getAllInsurancePoolNames();
    console.log("Insurance Pool Names:", insurancePoolNames);

    // Print the Insurance and NFT pool addresses from the DAO. Using getInsurancePoolAddresses per name.
    for (const poolName of insurancePoolNames) {
        const poolAddress = await graviDAO.getInsurancePoolAddresses(poolName);
        console.log(`Pool ${poolName} address:`, poolAddress);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  