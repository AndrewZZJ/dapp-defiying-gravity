# Gravi DAO Scripts

This directory contains scripts for deploying, managing, and interacting with the Gravi DAO project. The folder structure follows these categories:

- **deploy**: Scripts for deploying DAO contracts, initial setup, and token distribution
- **dao-propose**: Scripts for creating and managing governance proposals
- **dao-interact**: Scripts for interacting with the deployed DAO
- **view**: Scripts for reading data from contracts
- **insurance**: Scripts for interacting with insurance contracts
- **nft**: Scripts for NFT-related operations
- **utils**: Helper functions used across multiple scripts
- **metadata**: Deployment data, addresses, and other configuration

## Environment Setup

```bash
# Install and use Node.js v20
nvm install 20
nvm use 20

# Start local Hardhat node
npx hardhat node
```

## Deployment Sequence

```bash
# Core deployment
npx hardhat run scripts/deploy/deploy-main.ts --network localhost
npx hardhat run scripts/deploy/set-dao-parameters.ts --network localhost
npx hardhat run scripts/deploy/distribute-tokens.ts --network localhost

# Insurance and NFT setup
npx hardhat run scripts/deploy/deploy-insurance-initial.ts --network localhost
npx hardhat run scripts/deploy/initial-nft-auctions.ts --network localhost

# Complete deployment by transferring ownership
npx hardhat run scripts/deploy/complete-inital-deployment.ts --network localhost
```

## Governance Operations

```bash
# Delegate voting power to self (required before voting)
npx hardhat run scripts/dao-propose/delegate-votes.ts --network localhost

# Create and manage proposals
npx hardhat run scripts/dao-propose/insurance/add-insurance.ts --network localhost
npx hardhat run scripts/dao-propose/token/monthly-mint-gov-tokens.ts --network localhost
npx hardhat run scripts/dao-propose/nft/monthly-mint-nfts.ts --network localhost

# Skip time for testing (local only)
npx hardhat run scripts/dao-propose/time-skip.ts --network localhost
```

## DAO Interactions

```bash
# Purchase governance tokens
npx hardhat run scripts/view/view-gov-pool-and-burn-prices.ts --network localhost
npx hardhat run scripts/view/calc-gov-token-cost.ts --network localhost
npx hardhat run scripts/dao-interact/purchase-gov-tokens.ts --network localhost
```

## NFT Operations

```bash
# View NFT auctions
npx hardhat run scripts/view/nft/print-insurance-auctions.ts --network localhost

# Bid on and claim NFTs
npx hardhat run scripts/nft/bid-for-nft.ts --network localhost
npx hardhat run scripts/nft/claim-nft.ts --network localhost
```

## Insurance Operations

```bash
# View and purchase insurance
npx hardhat run scripts/view/insurance/print-insurances-and-nft-pools.ts --network localhost
npx hardhat run scripts/insurance/buy-insurance.ts --network localhost
npx hardhat run scripts/insurance/view-insurance.ts --network localhost
```

## Viewing Contract Data

```bash
# Token information
npx hardhat run scripts/view/print-gov-and-utility-tokens.ts --network localhost
npx hardhat run scripts/view/dao/print-voting-power.ts --network localhost

# Insurance and NFT data
npx hardhat run scripts/view/insurance/print-insurances-and-nft-pools.ts --network localhost