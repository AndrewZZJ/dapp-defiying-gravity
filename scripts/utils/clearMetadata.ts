// scripts/utils/clearMetadata.ts

import fs from "fs";
import path from "path";

/**
 * Clears the metadata folder by removing it recursively.
 */
export function clearMetadataFolder(): void {
  const metadataDir = path.join(__dirname, "..", "metadata");
  if (fs.existsSync(metadataDir)) {
    fs.rmSync(metadataDir, { recursive: true, force: true });
    console.log("Metadata folder cleared at:", metadataDir);
  } else {
    console.log("Metadata folder does not exist at:", metadataDir);
  }
}