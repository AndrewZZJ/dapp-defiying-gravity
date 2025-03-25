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
    console.log("Deploying contracts with account:", await deployer.getAddress());

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
    const deployerGraviGovBalance = await graviGov.balanceOf(await deployer.getAddress());
    console.log("Deployer GraviGov balance:", deployerGraviGovBalance.toString());

    // Get the address of the insurance and the NFT pool.
    const insurancePoolAddress = deploymentConfig["GraviInsurance"];
    if (!insurancePoolAddress) {
        throw new Error("InsurancePool address not found in deployment_config.txt");
    }

    const nftPoolAddress = deploymentConfig["GraviPoolNFT"];
    if (!nftPoolAddress) {
        throw new Error("NFTPool address not found in deployment_config.txt");
    }

    // Encode the function call data for addInsuranceAndNFTPool(poolName, insurancePoolAddress, nftPoolAddress).
    const encodedFunctionCall = graviDAO.interface.encodeFunctionData("addInsuranceAndNFTPool", [
        "Flood Insurance",
        insurancePoolAddress,
        nftPoolAddress
    ]);

    // Create the proposal.
    const proposalDescription = "Add Flood Insurance and NFT Pool to DAO.";
    console.log("Creating proposal to add insurance pool...");
    const txResponse = await graviDAO.propose(
        [graviGovAddress], // target(s) - in this case the DAO itself
        [0],                // value(s) in wei
        [encodedFunctionCall],
        proposalDescription
    );

    // console.log("Transaction sent:", txResponse.hash);

    // // Wait for the transaction to be mined
    // const receipt = await txResponse.wait();
    // console.log("Transaction mined:", receipt.transactionHash);

    // // Parse the logs to extract the ProposalCreated event
    // let proposalId = null;
    // for (const log of receipt.logs) {
    // try {
    //     // Try to parse the log using the contract's interface
    //     const parsedLog = contract.interface.parseLog(log);
    //     if (parsedLog.name === "ProposalCreated") {
    //     proposalId = parsedLog.args.proposalId;
    //     break;
    //     }
    // } catch (e) {
    //     // If the log isn't from our contract, skip it
    //     continue;
    // }
    // }

    // if (proposalId !== null) {
    // console.log("Proposal ID (from event):", proposalId.toString());
    // } else {
    // console.log("ProposalCreated event not found in receipt.");
    // }

    // const txResponse = await contract.propose(targets, values, calldatas, description);
    // console.log("Transaction sent:", txResponse.hash);

    // // Wait for the transaction to be mined
    // const receipt = await txResponse.wait();
    // console.log("Transaction mined:", receipt.transactionHash);


    // // -------------------------------
    // // Approve the proposal by casting a vote.
    // // -------------------------------
    // console.log("Casting vote in favor of the proposal...");
    // // Here, 1 represents a "For" vote.
    // const voteTx = await graviDAO.castVote(proposalId, 1);
    // await voteTx.wait();
    // console.log("Vote cast successfully.");
    
    // // Send the transaction (this executes the function on-chain)
    // const txResponse = await contract.propose(targets, values, calldatas, description);
    // console.log("Transaction sent:", txResponse.hash);

    // // Wait for the transaction to be mined
    // const receipt = await txResponse.wait();
    // console.log("Transaction mined:", receipt.transactionHash);

    // // Parse logs to extract the ProposalCreated event
    // let proposalId = null;
    // for (const log of receipt.logs) {
    //   try {
    //     // Attempt to parse each log using the contract's interface
    //     const parsedLog = contract.interface.parseLog(log);
    //     if (parsedLog.name === "ProposalCreated") {
    //       proposalId = parsedLog.args.proposalId;
    //       break;
    //     }
    //   } catch (e) {
    //     // This log does not belong to the contract; skip it.
    //     continue;
    //   }
    // }


//   // -------------------------------
//   // Simulate waiting for the voting period to end.
//   // -------------------------------
//   // If you are testing locally, increase the EVM time to simulate the end of the voting period.
//   // (Adjust the number of seconds as needed based on your DAO’s voting period.)
//   await network.provider.send("evm_increaseTime", [600]);
//   await network.provider.send("evm_mine");
//   console.log("Voting period ended.");

//   // Check the state of the proposal (for example, state 4 might indicate "Succeeded").
//   const proposalState = await graviDAO.state(proposalId);
//   console.log("Proposal state after voting period:", proposalState.toString());

//   // -------------------------------
//   // Queue the proposal.
//   // -------------------------------
//   console.log("Queueing the proposal...");
//   // The description hash must match the one used in the propose step.
//   const descriptionHash = ethers.utils.id(proposalDescription);
//   const queueTx = await graviDAO.queue(
//     [graviDAO.address],
//     [0],
//     [encodedFunctionCall],
//     descriptionHash
//   );
//   await queueTx.wait();
//   console.log("Proposal queued.");

//   // -------------------------------
//   // Execute the proposal.
//   // -------------------------------
//   // Increase time to pass the timelock delay (again, adjust as necessary).
//   await network.provider.send("evm_increaseTime", [600]);
//   await network.provider.send("evm_mine");

//   console.log("Executing the proposal...");
//   const executeTx = await graviDAO.execute(
//     [graviDAO.address],
//     [0],
//     [encodedFunctionCall],
//     descriptionHash
//   );
//   await executeTx.wait();
//   console.log("Proposal executed successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  