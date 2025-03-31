import { ExternalProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}