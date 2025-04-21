# GraviTrust - Decentralized Disaster Insurance

GraviTrust is a decentralized insurance platform addressing the gaps in traditional disaster coverage through blockchain technology, community governance, and transparent claim processing.

## 📋 Table of Contents
- [Introduction](#introduction)
- [Problem Statement](#problem-statement)
- [The GraviTrust Solution](#the-gravitrust-solution)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technical Stack](#technical-stack)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Scripts](#development-scripts)
- [Local Testing Guide](#local-testing-guide)
- [Testing](#testing)
- [Frontend Application](#frontend-application)
- [Contribution](#contribution)

## Introduction

GraviTrust reimagines disaster insurance by leveraging blockchain to create a transparent and community-driven insurance landscape. The platform addresses three critical challenges with current insurance providers:

1. The lack of accessible coverage in disaster-prone areas
2. The transparency of claim assessment processes
3. The inconsistent incentives between insurers and policyholders

By decentralizing risk pooling and governance, GraviTrust provides communities with a method to collectively safeguard their assets against climate-induced catastrophes while ensuring fairness and accountability.

## Problem Statement

Traditional insurance systems are increasingly failing vulnerable populations:
- Insurers are retreating from high-risk regions affected by climate change
- Economic losses due to natural disasters range from billions to hundreds of billions of dollars
- Profit-driven entities prioritize risk avoidance over promises made
- Individuals often neglect to purchase insurance due to perceived low probability of disasters (Prospect Theory)

## The GraviTrust Solution

GraviTrust introduces a dual-token economy and DAO governance to create a more resilient and transparent insurance ecosystem:

- **Decentralized Governance**: Policy structures and payouts are democratically validated rather than controlled by a select few
- **Incentivized Participation**: Rewards in the form of charity tokens (GraviCha) and governance tokens (GraviGov) encourage buying insurance and supporting others
- **Transparent Claims**: Immutable claim verification and decentralized consensus mechanisms ensure fair processing
- **Disaster Specialization**: Focused specifically on natural disaster coverage with an extendable framework for any disaster type and geography

## System Architecture

The GraviTrust ecosystem consists of multiple interconnected components implemented through seven unique smart contracts:

- **GraviGovernance & GraviDAO**: Implement the Decentralized Autonomous Organization (DAO)
- **GraviGov & GraviCha**: ERC20 tokens for governance and charitable rewards
- **GraviPoolNFT**: Charitable NFTs recognizing community engagement
- **GraviInsurance**: Manages insurance operations and policies
- **GraviDisasterOracle**: Provides external data validation for claim processing

### User Roles

- **Insurance Customers**: Purchase policies, submit claims, and receive payouts
- **Claim Moderators**: Evaluate submitted claims based on evidence and oracle data
- **Charitable Donors**: Contribute ETH to disaster-specific insurance pools 
- **Token Holders**: Participate in governance, auctions, and ecosystem activities

## Key Features

- **Transparent Governance**: Community-driven decisions through DAO voting
- **Dual-Token Economy**: Governance tokens (GraviGov) and charity tokens (GraviCha)
- **NFT Marketplace**: Charitable NFTs through auction and bidding system
- **Multiple Insurance Pools**: Specialized pools for different disaster types (Flood, Fire, Earthquake)
- **Moderator System**: Trusted claim evaluation with incentives for fair assessment
- **Oracle Integration**: External data validation for claim verification

## Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 19 | Core UI framework |
| Type System | TypeScript | Development |
| Styling | TailwindCSS | UI styling framework |
| Web3 Integration | ethers.js v6 | Ethereum communication |
| State Management | React Context API | Global state solution |
| Smart Contracts | Solidity 0.8.28 | Contract development |
| Contract Standards | ERC20, ERC721 | Token standards |
| Development Environment | Hardhat | Local blockchain & tooling |
| Storage | IPFS/Pinata | Decentralized storage |
| Testing | Hardhat & Sepolia | Contract testing |
| DAO Governance | OpenZeppelin Governor | Governance framework |

## Smart Contracts

- **GraviCha**: Charity token with minting and burning capabilities
- **GraviGov**: Governance token with voting functionality
- **GraviDAO**: Central hub for DAO operations and insurance management
- **GraviGovernance**: Implementation of OpenZeppelin Governor for proposal management
- **GraviPoolNFT**: NFT contracts for charitable auctions
- **GraviInsurance**: Insurance policy management and claims processing
- **GraviDisasterOracle**: External data validation service

## Getting Started

### Prerequisites
- Node.js v20 or higher
- npm or yarn
- MetaMask or another Web3 provider

### Installation

```bash
# Clone the repository
git clone https://github.com/AndrewZZJ/dapp-defiying-gravity.git
cd dapp-defiying-gravity

# Install dependencies
npm install

# Start local Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy/deploy-main.ts --network localhost
```

## Project Structure

```
dapp-defiying-gravity/
├── contracts/               # Smart contract source files
│   ├── tokens/              # Token contracts (GraviCha, GraviGov)
│   ├── interfaces/          # Contract interfaces
│   └── ...                  # Other contract files
├── scripts/                 # Deployment and interaction scripts
│   ├── deploy/              # Contract deployment scripts
│   ├── dao-propose/         # DAO proposal creation scripts
│   │   ├── insurance/       # Insurance-related proposals
│   │   ├── token/           # Token-related proposals
│   │   └── nft/             # NFT-related proposals
│   ├── view/                # Scripts for reading contract data
│   ├── insurance/           # Insurance interaction scripts
│   ├── nft/                 # NFT interaction scripts
│   ├── utils/               # Utility functions for scripts
│   └── metadata/            # Deployment data and configuration
├── test/                    # Test files for smart contracts
├── frontend-react/          # React frontend application
│   ├── public/              # Static assets and metadata
│   ├── src/                 # Source code
│   │   ├── artifacts/       # Contract ABIs
│   │   ├── components/      # React components
│   │   │   ├── buying_insurance/
│   │   │   ├── claims_covered/
│   │   │   ├── view_insurance/
│   │   │   ├── nft_marketplace/
│   │   │   ├── governance/
│   │   │   └── ...
│   │   ├── context/         # React context providers
│   │   └── ...
│   └── ...
└── docs/                    # Project documentation
    ├── sequence-diagrams/   # Sequence diagrams for user flows
    │   ├── insurance/       # Insurance-related flows
    │   ├── governance/      # Governance-related flows
    │   ├── nft/             # NFT-related flows
    │   └── donate/          # Donation-related flows
    └── class-diagrams/      # Class diagrams of system architecture
```

## Development Scripts

### Deployment Sequence

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

### Governance Operations

```bash
# Delegate voting power to self (required before voting)
npx hardhat run scripts/dao-propose/delegate-votes.ts --network localhost

# Create and manage proposals
npx hardhat run scripts/dao-propose/insurance/add-insurance.ts --network localhost
npx hardhat run scripts/dao-propose/token/monthly-mint-gov-tokens.ts --network localhost
npx hardhat run scripts/dao-propose/nft/monthly-mint-nfts.ts --network localhost
```

### View Contract Data

```bash
# Token information
npx hardhat run scripts/view/print-gov-and-utility-tokens.ts --network localhost
npx hardhat run scripts/view/dao/print-voting-power.ts --network localhost

# Insurance and NFT data
npx hardhat run scripts/view/insurance/print-insurances-and-nft-pools.ts --network localhost
```

## Local Testing Guide

To fully test the GraviTrust application locally, you'll need to run three separate terminal instances:

### Terminal 1: Local Hardhat Node
```bash
# Start the local Ethereum network
npx hardhat node
```
Keep this terminal running throughout your testing.

### Terminal 2: Contract Deployment & Setup
Before starting deployment, modify the distribute-tokens.ts script to set your own wallet address:

1. Open `scripts/deploy/distribute-tokens.ts`
2. Find the "Early Investor" entry in the distributions array
3. Replace the existing address with your own MetaMask wallet address
4. This will send 50 test ETH to your wallet for testing purposes

Then run the following scripts in sequence:

```bash
# Core deployment
npx hardhat run scripts/deploy/deploy-main.ts --network localhost
npx hardhat run scripts/deploy/set-dao-parameters.ts --network localhost
npx hardhat run scripts/deploy/distribute-tokens.ts --network localhost

# Insurance and NFT setup
npx hardhat run scripts/deploy/deploy-insurance-initial.ts --network localhost
npx hardhat run scripts/deploy/initial-nft-auctions.ts --network localhost

# Complete initial setup
npx hardhat run scripts/deploy/complete-inital-deployment.ts --network localhost

# Testing use cases
npx hardhat run scripts/dao-propose/delegate-votes.ts --network localhost
npx hardhat run scripts/nft/bid-for-nft.ts --network localhost
npx hardhat run scripts/nft/bid-for-nft2.ts --network localhost
npx hardhat run scripts/dao-propose/nft/monthly-mint-nfts.ts --network localhost
npx hardhat run scripts/dao-propose/add-insurance-real.ts --network localhost
```

### Terminal 3: Frontend Application
```bash
# Navigate to the React frontend
cd frontend-react

# Install dependencies
yarn

# Start the development server
yarn start
```

The frontend should now be accessible at http://localhost:3000. Use MetaMask connected to your local Hardhat network (typically http://127.0.0.1:8545 with Chain ID 31337).

### Additional Testing Tips

1. **Time Simulation**: Many features like auctions and governance require time to pass. Use the time-skip script when needed:
   ```bash
   npx hardhat run scripts/dao-propose/time-skip.ts --network localhost
   ```

2. **Account Connection**: Ensure MetaMask is connected to the local Hardhat network and you're using the accounts that received tokens during setup.

3. **Token Delegation**: Before participating in governance, you must delegate your voting power:
   ```bash
   npx hardhat run scripts/dao-propose/delegate-votes.ts --network localhost
   ```

4. **Error Handling**: If transactions fail, check the Hardhat node terminal for error logs, which provide more details than MetaMask errors.

## Testing

The project includes comprehensive test suites for all smart contracts:

```bash
# Compile the contract
npx hardhat compile

# Run all tests
npx hardhat test
```

## Frontend Application

### Starting the Frontend

```bash
# Navigate to the React frontend
cd frontend-react

# Install dependencies
yarn

# Start the development server
yarn start
```

### Key Frontend Features

- **Dashboard**: Overview of platform activity and user holdings
- **Insurance Purchase**: Interface for buying various types of disaster insurance
- **View Insurance**: Portfolio view of active insurance policies
- **Claims Management**: Submit and track claims for insured properties
- **NFT Marketplace**: Bid on charitable NFTs and view auction status
- **Governance**: View and vote on platform proposals
- **Token Exchange**: Purchase governance tokens with ETH and GraviCha

## Contribution

GraviTrust is an open-source project. Contributions are welcome through pull requests.

For detailed API documentation and further technical details, please refer to our project wiki or the documentation in the `/docs` directory.
