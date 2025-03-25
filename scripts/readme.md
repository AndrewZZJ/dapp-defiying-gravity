# Scripts for running
This contains the full script for deployment of the full Gravi Project. The folder structure follows the following structure:
- deploy: Scripts for deployment of the DAO, required contracts, and initial mint and distribution of governance tokens.
- dao: Scripts for interacting with DAO, many of those script simulates fast forward for testing. And thus can only be ran locally.
- view: Some commands for viewing important properties of the DAO or insurance contracts.
- utils: Utility and helper functions for the scripts and commands.
- metadata: Records all the important metadata of the deployment, including all relevant addresses. 

## Start the local node
npx hardhat node

## Run the following script for local host runs

### Deploy the initial DAO and initial Setup
- Deploy governance, charity tokens, and DAO: (WARNING: THIS ERASES PREVIOUS METADATA, back it up if necessary)
npx hardhat run scripts/deploy/deploy-main.ts --network localhost

- Configure initial DAO parameters:
npx hardhat run scripts/deploy/set-dao-parameters.ts --network localhost

- Distribute initial minted tokens (Note: Configure wallets and amount):
npx hardhat run scripts/deploy/distribute-tokens.ts --network localhost

- Deploy the initial 3 insurances
npx hardhat run scripts/deploy/deploy-insurance-initial.ts --network localhost

- Auctions initial NFTs - Founder NFTs for each contract
npx hardhat run scripts/deploy/initial-nft-auctions.ts --network localhost

- Revoke Deployer's Elevated power
npx hardhat run scripts/deploy/complete-inital-deployment.ts --network localhost

### DAO Scripts, governance, proposal creation, etc - For testing locally only, need to be adapted to actual network deployment. 
- Delegate voting power of all governace token to self:
npx hardhat run scripts/dao/delegate-votes.ts --network localhost

- Simulate a fast track DAO votes for adding insurance contract. 
npx hardhat run scripts/dao/insurance/add-insurance.ts --network localhost

### View scripts
- Print both the governance and utility tokens held by the deployer
npx hardhat run scripts/view/print-gov-and-utility-tokens.ts --network localhost

- Print the voting power of the deployer 
npx hardhat run scripts/view/dao/print-voting-power.ts --network localhost

- Print all the current added instuance and nft pools and addresses
npx hardhat run scripts/view/insurance/print-insurances-and-nft-pools.ts --network localhost

- Print all the NFTs undeer auction
npx hardhat run scripts/view/nft/print-insurance-auctions.ts --network localhost

## Bundled commands, fast setup and tests:
### Start/Restart the local node
npx hardhat node

### Deployment
npx hardhat run scripts/deploy/deploy-main.ts --network localhost
npx hardhat run scripts/deploy/set-dao-parameters.ts --network localhost
npx hardhat run scripts/deploy/distribute-tokens.ts --network localhost
npx hardhat run scripts/deploy/deploy-insurance-initial.ts --network localhost
npx hardhat run scripts/deploy/initial-nft-auctions.ts --network localhost
npx hardhat run scripts/deploy/complete-inital-deployment.ts --network localhost

### Dao local testing
npx hardhat run scripts/dao/delegate-votes.ts --network localhost
npx hardhat run scripts/dao/insurance/add-insurance.ts --network localhost

### View Deployed and Other
npx hardhat run scripts/view/print-gov-and-utility-tokens.ts --network localhost

npx hardhat run scripts/view/dao/print-voting-power.ts --network localhost

npx hardhat run scripts/view/insurance/print-insurances-and-nft-pools.ts --network localhost

npx hardhat run scripts/view/nft/print-insurance-auctions.ts --network localhost