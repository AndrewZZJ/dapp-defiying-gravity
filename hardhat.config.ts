import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 31337,
      blockConformations: 1,
      allowUnlimitedContractSize: true
    },
    sepolia: {
      chainId: 11155111,
      url: 'https://eth-sepolia.g.alchemy.com/v2/S11UGvRKlf4RaqDBBUHJFTwfVlh5bJuh',
      accounts: ['0xe5de0b39489ccf3d1f315599b957b01f2f007c8e7f59081bde13b4c4441a3bca']
    }
  },
  namedAccounts:{
    deployer: {
      default: 0
    }
  }
};

export default config;
