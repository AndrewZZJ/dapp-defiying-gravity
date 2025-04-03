// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

interface IGraviDAO is IGovernor {
    // 0. Inital setup
    function setFinishedInitialSetup() external;

    // 1. GraviGov Token Minting and Purchase Pool
    function setGovernanceTokenParameters(uint256 newRate, uint256 newPrice, uint256 newBurnAmount, uint256 mintAmount) external;

    function monthlyMintGovTokens() external;
    function setMonthlyGovMintAmount(uint256 newAmount) external;
    function setCharityTokenExchangeRate(uint256 newRate) external;
    
    function purchaseGovTokens(uint256 amount) external payable;
    function getGovTokenPoolBalance() external view returns (uint256);

    // function setGovTokenEthPrice(uint256 newPrice) external;
    // function setGovTokenGraviChaBurn(uint256 newBurnAmount) external;

    // function getGovTokenPurchasePrice() external view returns (uint256 ethPrice, uint256 graviChaBurn);
    function calculatesGovTokenPurchasePrice(uint256 amount) external view returns (uint256 ethPrice, uint256 graviChaBurn);

    // 2. Insurance Pool management, NFT Pool Management and Monthly Minting
    function addInsuranceAndNFTPool(
        string memory poolName, 
        address insurancePool, 
        address nftPool
    ) external;
    function removeInsuranceAndNFTPool(string memory insuranceName) external;
    function getInsurancePoolAddresses(string memory insuranceName) external view returns (address insurancePoolAddress, address nftPoolAddress);
    function getAllInsurancePoolNames() external view returns (string[] memory);
    function monthlyMintNFTForPool(string memory insuranceName, string[] calldata tokenURIs) external;
    function moveEtherFromInsurance(
        string memory insuranceName, 
        address payable recipient, 
        uint256 amount
    ) external;

    // 3. Insurance Disaster Event Recording and Management
    function recordDisasterEvent(
        string memory insuranceName,
        string memory eventName,
        string memory eventDescription,
        string[] calldata approvedCities,
        string[] calldata approvedProvinces,
        string calldata approvedCountry,
        string calldata autoPayoutGranularity,
        uint256 disasterDate,
        uint256 donationAmount,
        address[] calldata initialModerators
    ) external;
    function updateDonationAmount(
        string memory insuranceName,
        string memory eventId,
        uint256 newDonationAmount
    ) external;
    function modifyDisasterEvent(
        string memory insuranceName,
        string memory eventId,
        string memory newEventDescription,
        string[] calldata newApprovedCities,
        string[] calldata newApprovedProvinces,
        string calldata newApprovedCountry,
        string calldata newAutoPayoutGranularity,
        uint256 newDisasterDate
    ) external;
    function removeDisasterEvent(string memory insuranceName, string memory eventId) external;
    function addClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external;
    function removeClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external;

    // // Staking and Voting Rewards
    // function stakeGovTokens(uint256 amount) external;
    // function unstakeGovTokens(uint256 amount) external;
    // function claimStakingRewards() external;
    // function setStakingRewardRate(uint256 newRate) external;

    // GraviCha Token Management
    function addCharityMinterRole(address newMinter) external;
    function removeCharityMinterRole(address minter) external;

    // Ether Management
    // function getEtherBalance() external view returns (uint256);
    function transferEther(address payable recipient, uint256 amount) external;

    // DAO Governance Parameter Setters
    function setGovParameters(uint256 _votingDelay, uint256 _votingPeriod, uint256 _proposalThreshold) external;
    // function setVotingDelay(uint256 newDelay) external;
    // function setVotingPeriod(uint256 newPeriod) external;
    // function setProposalThreshold(uint256 newThreshold) external;
}
