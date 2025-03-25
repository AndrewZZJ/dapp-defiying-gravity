# For running the contract

## Start the local node
npx hardhat node

## Run the following script for local host runs

### Create the Tokens and the DAO
npx hardhat run scripts/0-deploy-DAO.ts --network localhost

### Deploy the insurance pool
npx hardhat run scripts/1-deploy-InsurancePool.ts --network localhost

### Add proposal to add insurance pool to DAO
npx hardhat run scripts/2-propose-add-insurancePool-to-DAO.ts --network localhost

### Vote for proposal
npx hardhat run scripts/3-vote-for-proposal.ts --network localhost

### Execute the proposal
npx hardhat run scripts/4-execute-proposal.ts --network localhost




### All At once
npx hardhat run scripts/0-deploy-DAO.ts --network localhost
npx hardhat run scripts/1-deploy-InsurancePool.ts --network localhost
npx hardhat run scripts/2-propose-add-insurancePool-to-DAO.ts --network localhost
npx hardhat run scripts/3-vote-for-proposal.ts --network localhost
npx hardhat run scripts/4-execute-proposal.ts --network localhost


npx hardhat run scripts/0-deploy-DAO.ts --network localhost
npx hardhat run scripts/1-deploy-InsurancePool.ts --network localhost
npx hardhat run scripts/a1-add_insurance_pool.ts --network localhost