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

    const GraviDAO = await ethers.getContractFactory("GraviDAO");
    // const graviDAO = GraviDAO.attach(graviDaoAddress);
    console.log("Using existing GraviDAO at:", graviDaoAddress);

    // Get the address of the GraviCha contract. And the instance of the contract.
    const graviChaAddress = deploymentConfig["GraviCha"];
    if (!graviChaAddress) {
        throw new Error("GraviCha address not found in deployment_config.txt");
    }

    const GraviCha = await ethers.getContractFactory("GraviCha");
    // const graviCha = GraviCha.attach(graviChaAddress);
    console.log("Using existing GraviCha at:", graviChaAddress);
        
    // Deploy GraviPoolNFT (requires GraviCha token address)
    const GraviPoolNFT = await ethers.getContractFactory("GraviPoolNFT");
    const graviPoolNFT = await GraviPoolNFT.deploy(graviChaAddress);
    await graviPoolNFT.waitForDeployment();
    const graviPoolNFTAddress = await graviPoolNFT.getAddress();
    console.log("GraviPoolNFT deployed to:", graviPoolNFTAddress);

    // Now we can deploy the GraviInsurance contract.
    const disasterType = "Flood";
    const premiumRate = 5; // 5%
    const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
    const graviInsurance = await GraviInsurance.deploy(
        disasterType,
        premiumRate,
        graviChaAddress,
        graviPoolNFTAddress
    );
    await graviInsurance.waitForDeployment();
    const graviInsuranceAddress = await graviInsurance.getAddress();
    console.log("GraviInsurance deployed to:", graviInsuranceAddress);

    // Now set the treasury (insurance) pool inside the NFT as the GraviInsurance contract.
    await graviPoolNFT.setTreasury(graviInsuranceAddress);
    console.log("GraviPoolNFT insurance pool set to:", graviInsuranceAddress);

    // Now we transfer ownership of the GraviInsurance contract to the GraviDAO.
    await graviInsurance.transferOwnership(graviDaoAddress);
    console.log("GraviInsurance ownership transferred to:", graviDaoAddress);

    // We also transfer ownership of the GraviPoolNFT contract to the GraviDAO.
    await graviPoolNFT.transferOwnership(graviDaoAddress);
    console.log("GraviPoolNFT ownership transferred to:", graviDaoAddress);

    // Save the new deployment addresses to the configuration file.
    writeDeploymentConfig({
        ...deploymentConfig,
        GraviPoolNFT: graviPoolNFTAddress,
        GraviInsurance: graviInsuranceAddress,
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
