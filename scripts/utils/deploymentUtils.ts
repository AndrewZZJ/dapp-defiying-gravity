// scripts/utils/deploymentUtils.ts

import fs from "fs";
import path from "path";

const METADATA_DIR = path.join(__dirname, "..", "metadata");
const FRONTEND_METADATA_DIR = path.join(__dirname, "..", "..", "frontend-react", "public", "metadata");

/**
 * Loads the deployment addresses from addresses.json.
 * @returns A record of contract names to addresses.
 */
export function loadDeploymentConfig(): Record<string, string> {
  const filePath = path.join(METADATA_DIR, "addresses.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment config file not found at ${filePath}.`);
  }
  const fileData = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileData);
}

/**
 * Writes the deployment addresses to addresses.json.
 * @param config - A record of contract names to addresses.
 */
export function writeDeploymentConfig(config: Record<string, string>): void {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
  const filePath = path.join(METADATA_DIR, "addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
  console.log("Deployment configuration written to:", filePath);

  const frontedFilePath = path.join(FRONTEND_METADATA_DIR, "addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
  console.log("Deployment configuration written to:", frontedFilePath);
}

/**
 * Writes JSON metadata (for insurances, proposals, etc.) to the given filename.
 */
export function writeMetadata(filename: string, data: any): void {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
  const filePath = path.join(METADATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("Metadata written to:", filePath);

  const frontedFilePath = path.join(FRONTEND_METADATA_DIR, "addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("Deployment configuration written to:", frontedFilePath);
}