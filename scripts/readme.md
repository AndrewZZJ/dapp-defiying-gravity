# For running the contract

## Start the local node
npx hardhat node

## Run the following script for local host runs

### Create the Tokens and the DAO
npx hardhat run scripts/0-deploy-DAO.ts --network localhost

### Deploy the insurance pool
npx hardhat run scripts/1-deploy-InsurancePool.ts --network localhost

### Add proposal to add insurance pool to DAO
