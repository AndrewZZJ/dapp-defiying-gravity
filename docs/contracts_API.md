# DeFiying Gravity - Smart Contract Documentation

This document provides a comprehensive overview of the DeFiying Gravity protocol's smart contract functions.

## Table of Contents
- [GraviGov Token](#gravigov-token)
- [GraviCha Token](#gravicha-token)
- [GraviPoolNFT](#gravipoolnft)
- [GraviDAO](#gravidao)
- [GraviGovernance](#gravigovernance)
- [GraviDisasterOracle](#gravidisasteroracle)
- [GraviInsurance](#graviinsurance)

## GraviGov Token

Governance token for the GraviDAO system.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `mintMonthly()` | Mints the monthly token allocation | None | None |
| `setMonthlyMintAmount(uint256)` | Updates the monthly mint amount | `_monthlyMintAmount`: New monthly mint amount | None |
| `mint(address, uint256)` | Mints new governance tokens to specified address | `to`: Recipient address, `amount`: Token amount | None |
| `delegate(address)` | Delegates voting power to an address | `delegatee`: Address to delegate to | None |
| `balanceOf(address)` | Gets token balance of an address | `account`: Address to check | `uint256`: Token balance |
| `transfer(address, uint256)` | Transfers tokens to a recipient | `to`: Recipient address, `amount`: Token amount | `bool`: Success status |
| `lastMintTimestamp()` | Returns the timestamp of the last mint operation | None | `uint256`: Timestamp |
| `monthlyMintAmount()` | Returns the monthly mint amount | None | `uint256`: Amount |
| `getVotes(address)` | Returns the current voting power for an account | `account`: Address to check | `uint256`: Voting power |
| `getPastVotes(address, uint256)` | Returns the voting power of an account at a specific block | `account`: Address, `blockNumber`: Block number | `uint256`: Voting power |
| `nonces(address)` | Gets the current nonce for an address (for EIP-2612 permits) | `owner`: Address to check | `uint256`: Nonce |

## GraviCha Token

Charity token used for donations and rewards.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `addMinter(address)` | Adds an address to the list of authorized minters | `account`: Address to authorize | None |
| `removeMinter(address)` | Removes an address from the list of authorized minters | `account`: Address to remove | None |
| `mint(address, uint256)` | Mints new charity tokens to a specified address | `to`: Recipient address, `amount`: Token amount | None |
| `burn(uint256)` | Burns tokens from the caller's balance | `value`: Amount to burn | None |
| `burnFrom(address, uint256)` | Burns tokens from a target address (requires approval) | `account`: Address to burn from, `value`: Amount to burn | None |
| `burnFromByOwner(address, uint256)` | Burns tokens from an address without approval | `account`: Address to burn from, `value`: Amount to burn | None |
| `minters(address)` | Checks if an address is an authorized minter | `account`: Address to check | `bool`: Is minter status |

## GraviPoolNFT

NFT contract that represents ownership in insurance pools.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `setTransferFee(uint256)` | Updates the fee for transferring NFTs | `_transferFee`: New fee amount | None |
| `transferWithFee(address, address, uint256)` | Transfers NFT with fee sent to treasury | `from`: Sender, `to`: Recipient, `tokenId`: NFT ID | None |
| `mintToPool(address, uint8, string)` | Mints NFT directly to insurance pool | `poolAddress`: Pool address, `treasuryIndex`: Treasury index, `tokenURI`: Metadata URI | `uint256`: New token ID |
| `mintAndAuctionNFTs(string[], address[])` | Mints multiple NFTs and starts auctions | `tokenURIs`: Metadata URIs, `insuranceAddresses`: Pool addresses | None |
| `bid(uint256, uint256)` | Places bid on active auction | `tokenId`: NFT ID, `bidAmount`: Bid amount | None |
| `withdraw()` | Allows outbid bidders to withdraw refundable tokens | None | None |
| `claimNFT(uint256)` | Allows highest bidder to claim NFT after auction ends | `tokenId`: NFT ID | None |
| `getAuctionedNFTs()` | Returns a list of all NFTs that have been auctioned | None | `uint256[]`: Array of token IDs |
| `getAuctionDetails(uint256)` | Returns auction details for a specific token | `tokenId`: NFT ID | Multiple return values about auction |
| `getTreasuryAddress(uint256)` | Gets the treasury address for a specific token ID | `tokenId`: NFT ID | `address`: Treasury address |
| `forceEndAuction(uint256)` | Forcefully ends an auction after the duration has passed | `tokenId`: NFT being auctioned | None |
| `setAuctionDuration(uint256)` | Updates the duration for all auctions | `_auctionDuration`: New duration in seconds | None |
| `setToken(address)` | Updates the token used for bidding | `_token`: Address of the GraviCha token | None |
| `burnExcessTokens(uint256)` | Burns excess tokens held by the contract | `amount`: Amount of tokens to burn | None |
| `burn(uint256)` | Burns an NFT in case of emergency | `tokenId`: NFT ID to burn | None |
| `addTreasuryAddress(address)` | Adds a new treasury address to the list of insurance pools | `treasury`: Address of insurance pool to add | None |
| `getTreasuryAddresses()` | Returns all treasury addresses | None | `address[]`: Treasury addresses |
| `withdrawableAmount()` | Returns the amount of tokens a bidder can withdraw | None | `uint256`: Withdrawable amount |
| `setTreasuryAddress(uint8, address)` | Updates an existing treasury address | `index`: Index to update, `treasury`: New address | None |
| `transferWithDonation(address, address, uint256)` | Transfers an NFT with a custom donation to treasury | `from`: Sender, `to`: Recipient, `tokenId`: NFT ID | None |
| `getTreasuryIndexByAddress(address)` | Finds the index of a treasury given its address | `treasuryAddress`: Treasury to search for | `uint8`: Treasury index |

## GraviDAO

DAO contract that manages governance tokens, insurance pools, and NFT operations.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `setGovernanceTokenParameters(uint256, uint256, uint256)` | Sets governance token parameters | `newPrice`: ETH price, `newBurnAmount`: GraviCha burn, `mintAmount`: Monthly mint | None |
| `monthlyMintGovTokens()` | Mints the monthly allocation of governance tokens | None | None |
| `purchaseGovTokens(uint256)` | Allows users to purchase governance tokens | `amount`: Number of tokens to purchase | None |
| `calculatesGovTokenPurchasePrice(uint256)` | Calculates cost of purchasing governance tokens | `amount`: Number of tokens | `ethPrice`: ETH required, `graviChaBurn`: GraviCha required |
| `addInsurancePool(string, address)` | Adds a new insurance pool | `poolName`: Pool identifier, `insurancePool`: Pool address | None |
| `removeInsurancePool(string)` | Removes an existing insurance pool | `insuranceName`: Pool identifier | None |
| `getAllInsurancePoolNames()` | Returns all insurance pool names | None | `string[]`: Pool names |
| `monthlyMintNFTForPool(string, string[])` | Mints NFTs for a specified insurance pool | `insuranceName`: Pool name, `tokenURIs`: Token URIs | None |
| `nominateModerator(address)` | Nominates an address as claims moderator | `_moderator`: Address to nominate | None |
| `voteForModerator(address)` | Votes for a nominated moderator | `_moderator`: Moderator address | None |
| `getTopModerators(uint256)` | Gets the top voted moderators | `_count`: Number to return | `address[]`, `uint256[]`: Moderators and votes |
| `getAllNominatedModerators()` | Gets all nominated moderators with votes | None | `address[]`, `uint256[]`, `address[]`: Moderators, votes, nominators |
| `setTimelockController(address)` | Sets the timelock controller address | `_timelockController`: New controller address | None |
| `setMonthlyGovMintAmount(uint256)` | Sets monthly mint amount for governance tokens | `newAmount`: New monthly mint amount | None |
| `setNFTPool(address)` | Sets or updates the NFT pool used by the DAO | `_nftPool`: Address of new NFT pool | None |
| `getInsurancePoolAddresses(string)` | Gets addresses of insurance pool and NFT pool | `insuranceName`: Pool identifier | `address`, `address`: Pool addresses |
| `moveEtherFromInsurance(string, address, uint256)` | Transfers ETH from insurance pool to recipient | `insuranceName`: Pool name, `recipient`: Recipient address, `amount`: ETH amount | None |
| `toggleModeratorRewards(bool)` | Enables or disables moderator rewards | `enabled`: Whether rewards are enabled | None |
| `setModeratorRewardAmounts(uint256, uint256)` | Updates reward amounts for nominations and voting | `newNominationReward`: Nomination reward, `newVotingReward`: Voting reward | None |
| `resetModerators()` | Resets all moderator nominations and votes | None | None |
| `setModeratorThresholds(uint256, uint256)` | Updates thresholds for nominations and voting | `_nominationThreshold`: Nomination threshold, `_votingThreshold`: Voting threshold | None |
| `isTopModerator(address, uint256)` | Checks if address is among top moderators | `_moderator`: Address to check, `_topCount`: Top count to consider | `bool`, `uint256`: Is top and rank |
| `getNominatedModeratorCount()` | Gets total number of nominated moderators | None | `uint256`: Count |
| `getModeratorRewardInfo()` | Returns current moderator reward information | None | `bool`, `uint256`, `uint256`: Enabled status, nomination reward, voting reward |

## GraviGovernance

Implementation of the governance system for the protocol.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `setGovernanceParameters(uint256, uint256, uint256)` | Updates governance parameters | `newVotingDelay`: Blocks before voting, `newVotingPeriod`: Voting duration, `newProposalThreshold`: Minimum votes to propose | None |
| `createProposal(string, string, address[], uint256[], bytes[])` | Creates a proposal with metadata | `title`: Proposal title, `description`: Description, `targets`, `values`, `calldatas`: Proposal actions | `uint256`: Proposal ID |
| `createProposalWithReward(string, string, address[], uint256[], bytes[])` | Creates proposal and claims reward | Same as `createProposal` | `uint256`: Proposal ID |
| `castVoteWithReward(uint256, uint8)` | Casts vote and rewards voter | `proposalId`: Proposal ID, `support`: Vote type (0=Against, 1=For, 2=Abstain) | `uint256`: Vote weight |
| `castVoteWithReasonAndReward(uint256, uint8, string)` | Casts vote with reason and reward | `proposalId`, `support`, `reason`: Vote reason | `uint256`: Vote weight |
| `getAllProposalIds()` | Returns all proposal IDs | None | `uint256[]`: Proposal IDs |
| `getProposalDetail(uint256)` | Gets detailed info about a proposal | `proposalId`: Proposal ID | `ProposalData`: Detailed proposal info |
| `getRewardInfo()` | Returns current reward information | None | `bool`, `uint256`, `address`: Rewards enabled, reward amount, token address |
| `getProposalCount()` | Returns the total number of proposals created | None | `uint256`: Proposal count |
| `toggleVoteRewards(bool)` | Enables or disables vote rewards | `enabled`: Whether rewards should be enabled | None |
| `setVoteRewardAmount(uint256)` | Updates the reward amount for voting | `newAmount`: New reward amount in wei | None |
| `hasVoterClaimedReward(uint256, address)` | Checks if voter has claimed reward for proposal | `proposalId`: Proposal ID, `voter`: Voter address | `bool`: Has claimed status |
| `votingDelay()` | Returns the delay before voting on a proposal begins | None | `uint256`: Voting delay in blocks |
| `votingPeriod()` | Returns the duration of voting period | None | `uint256`: Voting period in blocks |
| `proposalThreshold()` | Returns minimum votes required to create proposal | None | `uint256`: Proposal threshold |

## GraviDisasterOracle

A simplified oracle that verifies disaster type against a whitelist.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `validateClaim(string)` | Validates disaster type against whitelist | `disasterType`: Type of disaster | `bool`: Whether type is valid |

## GraviInsurance

Implementation of disaster insurance policies and claims management.

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `buyInsurance(uint256, uint256, string, uint256)` | Buys an insurance policy | `startTime`: Coverage start, `coveragePeriod`: Days of coverage, `propertyAddress`: Insured property, `propertyValue`: Property value | `bytes32`: Policy ID |
| `getUserPolicies()` | Gets caller's insurance policies | None | Multiple arrays with policy details |
| `calculatePremium(string, uint256, uint256)` | Calculates insurance premium | `propertyAddress`, `propertyValue`, `coveragePeriod` | `uint256`: Premium amount |
| `donate()` | Donates ETH to pool and receives tokens | None | `uint256`: Tokens received |
| `startAClaim(string, bytes32, string)` | Starts a new claim for a policy | `eventId`: Disaster event, `policyId`: Policy ID, `incidentDescription`: Incident details | `bool`: Success status |
| `assessClaim(uint256, bool, uint256)` | Allows moderator to assess claim | `claimId`: Claim ID, `isApproved`: Approval status, `amount`: Approved amount | None |
| `processClaim(uint256)` | Processes claim based on moderator votes | `claimId`: Claim ID | None |
| `payoutClaim(uint256)` | Pays out approved claim | `claimId`: Claim ID | None |
| `getDisasterEvent(string)` | Gets details of a disaster event | `eventId`: Event ID | Event name, description, date |
| `getAllDisasterEvents()` | Gets all disaster events | None | `string[]`: Event IDs |
| `getUserClaims()` | Gets claims associated with caller | None | Multiple arrays with claim details |
| `getTopDonors()` | Retrieves top 10 highest donors | None | `address[]`, `uint256[]`: Donor addresses and amounts |
| `fetchInsuranceIds(address)` | Gets policy IDs for a given user | `user`: User address | `bytes32[]`: Policy IDs |
| `calculateCoverageAmountFromPremium(uint256)` | Calculates coverage based on premium | `premium`: Premium amount | `uint256`: Coverage amount |
| `getDonationRewardRate()` | Gets the donation reward rate | None | `uint256`: Reward rate |
| `setDonationRewardRate(uint256)` | Sets the donation reward rate | `newRate`: New reward rate | None |
| `addDisasterEvent(string, string, uint256)` | Adds a new disaster event | `eventName`, `eventDescription`, `disasterDate` | None |
| `modifyDisasterEvent(string, string, string, uint256)` | Modifies an existing disaster event | `eventId`, `newName`, `newEventDescription`, `disasterDate` | None |
| `removeDisasterEvent(string)` | Removes a disaster event | `eventId`: Event to remove | None |
| `addModeratorToPool(address, uint256)` | Adds moderator to the pool | `moderator`: Address to add, `maxAmount`: Maximum approval amount | None |
| `removeModeratorFromPool(address)` | Removes moderator from the pool | `moderator`: Address to remove | None |
| `transferEther(address, uint256)` | Transfers ether to a recipient | `recipient`: Address to receive ETH, `amount`: Amount to transfer | None |
| `getAllDonors()` | Gets all donors and their donation amounts | None | `address[]`, `uint256[]`: Donors and amounts |
| `getUserPolicy(bytes32)` | Gets details of a specific policy | `policyId`: Policy ID | Multiple return values about policy |
| `getClaimModerators(uint256)` | Gets moderators for a specific claim | `claimId`: Claim ID | `address[]`: Moderator addresses |
| `fetchClaimIds(address)` | Gets claim IDs for a specific user | `user`: User address | `uint256[]`: Claim IDs |
| `getClaimDetails(uint256)` | Gets detailed information about a claim | `claimId`: Claim ID | Multiple return values about claim |