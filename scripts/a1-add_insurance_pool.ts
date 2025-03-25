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
    // Get the address of the insurance and the NFT pool.
    const insurancePoolAddress = deploymentConfig["GraviInsurance"];
    if (!insurancePoolAddress) {
        throw new Error("InsurancePool address not found in deployment_config.txt");
    }

    const nftPoolAddress = deploymentConfig["GraviPoolNFT"];
    if (!nftPoolAddress) {
        throw new Error("NFTPool address not found in deployment_config.txt");
    }

    console.log("Using existing GraviGov at:", graviGovAddress);
    console.log("Using existing InsurancePool at:", insurancePoolAddress);
    console.log("Using existing NFTPool at:", nftPoolAddress);

    // Encode the function call data for addInsuranceAndNFTPool(poolName, insurancePoolAddress, nftPoolAddress).
    await graviDAO.addInsuranceAndNFTPool(
        "Flood Insurance",
        insurancePoolAddress,
        nftPoolAddress);

    console.log("Proposal to add insurance and NFT pool submitted.");

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
  