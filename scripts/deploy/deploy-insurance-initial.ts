// scripts/deploy/deploy-insurance-initial.ts

import { ethers } from "hardhat";
import { loadDeploymentConfig, writeDeploymentConfig, writeMetadata } from "../utils/deploymentUtils";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying initial insurances with account:", deployerAddress);

  // Load core deployments.
  const deploymentConfig = loadDeploymentConfig();
  const graviChaAddress = deploymentConfig["GraviCha"];
  const graviDAOAddress = deploymentConfig["GraviDAO"];
  const graviOracleAddress = deploymentConfig["GraviDisasterOracle"];
  if (!graviChaAddress || !graviDAOAddress ||!graviOracleAddress) {
    throw new Error("Core contracts not deployed. Run deploy-main.ts first.");
  }

  // Load graviDAO contract.
  const graviDAO = await ethers.getContractAt("GraviDAO", graviDAOAddress);

  // Define mock event data for each disaster type
  const mockEventData: Record<string, string[]> = {
    fire: ["Palisades Wildfire 2024", "Big Bear Blaze 2024"],
    flood: ["Ohio River Flood 2024", "Louisiana Swell 2024"],
    earthquake: ["San Andreas Shaker 2024", "Tokyo Quake 2024"],
  };

  // Define the three insurances.
  const insurances = [
    { name: "Fire Insurance", disaster: "fire", premium: 4, donationRewardRate: 10000},
    { name: "Flood Insurance", disaster: "flood", premium: 5, donationRewardRate: 5000},
    { name: "Earthquake Insurance", disaster: "earthquake", premium: 6, donationRewardRate: 2000},
  ];

  // To hold deployed insurance data.
  const deployedInsurances: Record<string, { insuranceAddress: string }> = {};


  for (const insurance of insurances) {
    console.log(`Deploying ${insurance.name}...`);

    // Deploy GraviInsurance.
    const GraviInsurance = await ethers.getContractFactory("GraviInsurance");
    const graviInsurance = await GraviInsurance.deploy(
      insurance.disaster,
      insurance.premium,
      graviChaAddress,
      graviOracleAddress
    );
    await graviInsurance.waitForDeployment();
    const graviInsuranceAddress = await graviInsurance.getAddress();
    console.log(`${insurance.name} - GraviInsurance deployed at: ${graviInsuranceAddress}`);

    // Set the setDonationRewardRate based on donationRewardRate
    const donationRewardRate = insurance.donationRewardRate;
    const tranx1 = await graviInsurance.setDonationRewardRate(donationRewardRate);
    await tranx1.wait();
    console.log(`${insurance.name} - Donation reward rate set to: ${donationRewardRate}`);

    // Add a proper generic Disaster event to the GraviInsurance contract.
    const capitalizedDisaster = insurance.disaster.charAt(0).toUpperCase() + insurance.disaster.slice(1);
    const genericEventName = `${capitalizedDisaster} Alert: General Coverage Active`;
    const genericEventDescription = `This is a generic ${insurance.disaster} event that activates insurance coverage for all related policies.`;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tranx = await graviInsurance.addDisasterEvent(
      genericEventName,
      genericEventDescription,
      currentTimestamp,
    );
    await tranx.wait();
    console.log(`${insurance.name} - Generic event added: ${genericEventName}`);
    
    // Add specific disaster events from mockEventData
    if (mockEventData[insurance.disaster]) {
      for (const eventName of mockEventData[insurance.disaster]) {
        // Generate a random date within the last 30 days
        const eventTimestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30);
        const eventDate = new Date(eventTimestamp * 1000);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Create detailed, professional descriptions based on event name
        let eventDescription = "";
        
        if (eventName === "Palisades Wildfire 2024") {
          eventDescription = `Severe wildfire that began on ${formattedDate} in the Palisades region, affecting approximately 2,500 acres of residential and forest land. Strong Santa Ana winds contributed to rapid spread, prompting evacuation orders for 1,200+ residents.`;
        } 
        else if (eventName === "Big Bear Blaze 2024") {
          eventDescription = `Major forest fire reported near Big Bear Lake on ${formattedDate}. The fire consumed over 3,800 acres of wilderness and threatened several mountain communities. Dry conditions and high temperatures accelerated fire growth, requiring multi-agency response.`;
        }
        else if (eventName === "Ohio River Flood 2024") {
          eventDescription = `Severe flooding along the Ohio River basin beginning ${formattedDate}. Heavy rainfall caused the river to crest at 52 feet, 12 feet above flood stage. Affected communities include Cincinnati, Louisville, and numerous smaller towns, with over 2,000 properties experiencing water damage.`;
        }
        else if (eventName === "Louisiana Swell 2024") {
          eventDescription = `Flash flooding in southern Louisiana starting ${formattedDate} after 15+ inches of rain fell within 48 hours. The rapid water accumulation overwhelmed local drainage systems, particularly affecting Baton Rouge and surrounding parishes. Storm surge and high tides compounded the flooding issues.`;
        }
        else if (eventName === "San Andreas Shaker 2024") {
          eventDescription = `Magnitude 6.4 earthquake occurred along the San Andreas fault on ${formattedDate}. The epicenter was located 12 miles east of San Bernardino with a depth of 8 miles. Structural damage was reported across multiple counties, with aftershocks continuing for 72+ hours.`;
        }
        else if (eventName === "Tokyo Quake 2024") {
          eventDescription = `A magnitude 7.1 earthquake struck the Greater Tokyo Area on ${formattedDate}. The hypocenter was registered at 30km below Tokyo Bay. Significant infrastructure damage was reported in six prefectures, affecting transportation networks and causing temporary power outages to over 200,000 homes.`;
        }
        else {
          // Generic fallback description if event name not recognized
          eventDescription = `This ${insurance.disaster} event occurred on ${formattedDate} in regions covered by insurance policies, causing significant damage to protected properties and infrastructure.`;
        }
        
        const specificTranx = await graviInsurance.addDisasterEvent(
          eventName,
          eventDescription,
          eventTimestamp,
        );
        await specificTranx.wait();
        console.log(`${insurance.name} - Specific event added: ${eventName}`);
      }
    }

    // Transfer ownership of GraviInsurance to GraviDAO.
    await graviInsurance.transferOwnership(graviDAOAddress);
    console.log(`${insurance.name} - Ownership transferred to GraviDAO.`);

    // Add the insurance to the DAO.
    await graviDAO.addInsurancePool(insurance.name, graviInsuranceAddress);
    console.log(`${insurance.name} - Insurance added to GraviDAO.`);

    // Save the deployed insurance address.
    deployedInsurances[insurance.name] = {
      insuranceAddress: graviInsuranceAddress,
    };
  }

  // Write insurances metadata to scripts/metadata/insurances.json.
  writeMetadata("insurances.json", deployedInsurances);

  // Optionally update the global deployment config with insurance addresses.
  writeDeploymentConfig({
    ...deploymentConfig,
    ...Object.fromEntries(
      Object.entries(deployedInsurances).map(([name, addrs]) => [
        name.replace(/\s+/g, ""), // e.g. "FireInsurance"
        addrs.insuranceAddress,
      ])
    )
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});