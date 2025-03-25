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

    // Check the voting power of the deployer (Before Delegating).
    let currentBlock = await ethers.provider.getBlockNumber();
    let votes = await graviDAO.getVotes(await deployer.getAddress(), currentBlock - 1);
    console.log("Voting power (After Delegation):", votes.toString());

    // Deligate the voting power of the tokens to self.
    console.log("Delegating votes to self...");
    await graviGov.delegate(await deployer.getAddress());

    // Wait a block to update the voting power.
    await ethers.provider.send("evm_mine", []);

    // Check the voting power of the deployer.
    currentBlock = await ethers.provider.getBlockNumber();
    votes = await graviDAO.getVotes(await deployer.getAddress(), currentBlock - 1);
    console.log("Voting power (After Delegation):", votes.toString());

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
        [graviDaoAddress], // target(s) - in this case the DAO itself
        [0],                // value(s) in wei
        [encodedFunctionCall],
        proposalDescription
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  