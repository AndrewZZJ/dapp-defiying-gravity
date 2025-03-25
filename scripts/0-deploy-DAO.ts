import { ethers } from "hardhat";

import fs from "fs";
import path from "path";

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

    // Deploy GraviCha token - Charitable token
    const GraviCha = await ethers.getContractFactory("GraviCha");
    const graviCha = await GraviCha.deploy();
    await graviCha.waitForDeployment();
    const graviChaAddress = await graviCha.getAddress();
    console.log("GraviCha deployed to:", graviChaAddress);

    // Deploy GraviGov token - Governance token
    const GraviGov = await ethers.getContractFactory("GraviGov");
    const graviGov = await GraviGov.deploy(graviChaAddress);
    await graviGov.waitForDeployment();
    const graviGovAddress = await graviGov.getAddress();
    console.log("GraviGov deployed to:", graviGovAddress);

    // Initial minting of GraviGov tokens
    await graviGov.mint(await deployer.getAddress(), 1000000);

    // Print the balance of the deployer
    const balance = await graviGov.balanceOf(await deployer.getAddress());
    console.log("GraviGov balance of deployer:", balance.toString());

    // Deploy TimelockController
    const minDelay = 0;
    const proposers: string[] = [];
    const executors: string[] = [];
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockController.deploy(minDelay, proposers, executors, deployer.address);
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();
    console.log("TimelockController deployed to:", timelockAddress);

    // Deploy the DAO
    const GraviDAO = await ethers.getContractFactory("GraviDAO");
    const graviDAO = await GraviDAO.deploy(graviChaAddress, graviGovAddress, graviGovAddress, timelockAddress);
    await graviDAO.waitForDeployment();
    const graviDAOAddress = await graviDAO.getAddress();
    console.log("GraviDAO deployed to:", graviDAOAddress);

    // Grant required roles to the graviDAO
    let PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    let EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

    await timelock.grantRole(PROPOSER_ROLE, graviDAOAddress);
    await timelock.grantRole(EXECUTOR_ROLE, graviDAOAddress);

    // // For test
    // await timelock.grantRole(PROPOSER_ROLE, await deployer.getAddress());
    // await timelock.grantRole(EXECUTOR_ROLE, await deployer.getAddress());

    // Grant minting roles
    await graviCha.addMinter(graviDAOAddress);
    await graviCha.addMinter(graviGovAddress);

    // Transfer ownerships
    await graviCha.transferOwnership(graviDAOAddress);
    await graviGov.transferOwnership(graviDAOAddress);

    // Write addresses to file using the helper function.
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
