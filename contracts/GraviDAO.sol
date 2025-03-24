// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// OpenZeppelin Contracts
// References: https://docs.openzeppelin.com/contracts/5.x/governance
import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interfaces
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviGov} from "./interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

// No proxy contract: GraviDAO is not upgradeable
// import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// The GraviDAO contract is the governance contract for the GraviCha ecosystem.
contract GraviDAO is Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    ReentrancyGuard
{
    // ---------------------------------------------------
    // State variables - The tokens and pools managed by GraviDAO
    // ---------------------------------------------------
    IGraviCha public graviCha;
    IGraviGov public graviGov;

    // ---------------------------------------------------
    // State variables for GraviGov token management
    // ---------------------------------------------------
    uint256 public lastGovMintTime;
    uint256 public monthlyGovMintAmount = 1000; // Settable by DAO vote
    // uint256 public maxGovPurchasePerTx = 100; // Limit for GraviGov token purchase per transaction

    // Purchase parameters for GraviGov tokens
    uint256 public govTokenEthPrice = 100 wei;      // Price (in wei) per Gov token
    uint256 public govTokenGraviChaBurn = 1;    // Amount of GraviCha tokens to burn per Gov token

    // ---------------------------------------------------
    // Staking for GraviGov tokens 
    // ---------------------------------------------------
    mapping(address => uint256) public stakedGov;
    mapping(address => uint256) public stakingRewardBalance;
    mapping(address => uint256) public lastRewardUpdate;
    uint256 public stakingRewardRate; // Reward rate (GraviChar per second per staked Gov token)

    // ---------------------------------------------------
    // State variables for Insurance and NFT pool
    // ---------------------------------------------------
    mapping(string => IGraviInsurance) public insurancePools;
    mapping(string => address) public nftPools;
    string[] public insurancePoolNames;
    address[] public nftPoolList;
    // uint256 public lastNFTPoolMint;

    // ---------------------------------------------------
    // Voting reward: Award GraviChar when a vote is cast
    // ---------------------------------------------------
    mapping(uint256 => mapping(address => bool)) public voteRewarded;
    // uint256 public voteRewardAmount = 1; // Amount of GraviChar awarded per vote

    // ---------------------------------------------------
    // State variables for voting and governance
    // ---------------------------------------------------
    uint256 public govVotingDelay = 7200; // 1 day
    uint256 public govVotingPeriod = 50400; // 1 week
    uint256 public govProposalThreshold = 0;

    // ---------------------------------------------------
    // Events - Emitted for important contract actions
    // ---------------------------------------------------
    event InsuranceCreated(string disasterType, address poolAddress);
    event InsuranceRemoved(string disasterType, address poolAddress);
    event NFTPoolAdded(address poolAddress);
    event NFTPoolRemoved(address poolAddress);
    event GovTokensPurchased(address indexed buyer, uint256 amount);
    event GovTokensDonated(address indexed donor, uint256 amount);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event StakingRewardClaimed(address indexed staker, uint256 reward);

    // ---------------------------------------------------
    // Constructor
    // ---------------------------------------------------
    constructor(
        address _graviCha, 
        address _graviGov,
        IVotes _token,
        TimelockController _timelock
    ) Governor("GraviDAO") GovernorVotes(_token) GovernorVotesQuorumFraction(4) GovernorTimelockControl(_timelock) {
        // Ensure the governance token (used by GovernorVotes) is the GraviGov token.
        require(address(_token) == _graviGov, "GraviGov token must be used for governance");

        // Set the GraviCha and GraviGov contracts
        graviCha = IGraviCha(_graviCha);
        graviGov = IGraviGov(_graviGov);

        // Transfer ownership of GraviCha to the DAO if not already owned by it.
        if (Ownable(_graviCha).owner() != address(this)) {
            Ownable(_graviCha).transferOwnership(address(this));
        }
        // Transfer ownership of GraviGov to the DAO if not already owned by it.
        if (Ownable(_graviGov).owner() != address(this)) {
            Ownable(_graviGov).transferOwnership(address(this));
        }

        // Ensure that DAO is a minter for GraviCha (For GraviGov owner can mint)
        graviCha.addMinter(address(this));
    }

    // ---------------------------------------------------
    // Time utility functions
    // ---------------------------------------------------
    // function hasMonthPassed(uint256 lastTimestamp) public view returns (bool) {
    //     return block.timestamp >= lastTimestamp + 30 days;
    // }
    // function lastGoveMintTime() public view returns (uint256) {
    //     return lastGovMintTime;
    // }

    // function lastNFTPoolMintTime() public view returns (uint256) {
    //     return lastNFTPoolMint;
    // }

    // ---------------------------------------------------
    // 1. GraviGov Token Minting and Purchase Pool
    // ---------------------------------------------------
    function monthlyMintGovTokens() external onlyGovernance {
        graviGov.mint(address(this), monthlyGovMintAmount);
        lastGovMintTime = block.timestamp;
    }

    function purchaseGovTokens(uint256 amount) external payable {
        // require(amount > 0 && amount <= maxGovPurchasePerTx, "Amount exceeds max purchase limit or under 0.");
        require(graviGov.balanceOf(address(this)) >= amount, "Not enough governance tokens in pool");
        require(msg.value == amount * govTokenEthPrice, "Incorrect Ether amount sent");

        // Burn the required GraviCha tokens from the sender.
        graviCha.burnFrom(msg.sender, amount * govTokenGraviChaBurn);

        // Transfer GraviGov tokens from the DAO pool (this contract) to the buyer.
        require(graviGov.transfer(msg.sender, amount), "Gov token transfer failed");
        
        emit GovTokensPurchased(msg.sender, amount);
    }

    // function donateGovTokens(uint256 amount) external {
    //     require(amount > 0, "Amount must be greater than zero");
    //     require(graviGov.transferFrom(msg.sender, address(this), amount), "Gov token transfer failed");
    //     emit GovTokensDonated(msg.sender, amount);
    // }

    function getGovTokenPoolBalance() external view returns (uint256) {
        return graviGov.balanceOf(address(this));
    }

    // Setters for GraviGov token purchase parameters and monthly minting
    function setGovTokenEthPrice(uint256 newPrice) external onlyGovernance {
        govTokenEthPrice = newPrice;
    }

    function setGovTokenGraviChaBurn(uint256 newBurnAmount) external onlyGovernance {
        govTokenGraviChaBurn = newBurnAmount;
    }

    function setMonthlyGovMintAmount(uint256 newAmount) external onlyGovernance {
        monthlyGovMintAmount = newAmount;
    }

    // function setMaxGovPurchasePerTx(uint256 newMax) external onlyGovernance {
    //     maxGovPurchasePerTx = newMax;
    // }

    // ---------------------------------------------------
    // 2. Insurance Pool management, NFT Pool Management and Monthly Minting
    // ---------------------------------------------------
    function addInsuranceAndNFTPool(
        string memory poolName, 
        address insurancePool, 
        address nftPool
    ) external onlyGovernance {
        require(address(insurancePools[poolName]) == address(0), "Insurance pool already exists");
        require(nftPools[poolName] == address(0), "NFT pool already exists");

        // Check DAO ownership of both contracts
        require(Ownable(insurancePool).owner() == address(this), "DAO must own insurance pool");
        require(Ownable(nftPool).owner() == address(this), "DAO must own NFT pool");

        insurancePools[poolName] = IGraviInsurance(insurancePool);
        nftPools[poolName] = nftPool;
        insurancePoolNames.push(poolName);

        // Automatically grant minter role for GraviCha to both contracts
        graviCha.addMinter(insurancePool);
        graviCha.addMinter(nftPool);

        emit InsuranceCreated(poolName, insurancePool);
        emit NFTPoolAdded(nftPool);
    }

    function removeInsuranceAndNFTPool(string memory poolName) external onlyGovernance {
        address insPool = address(insurancePools[poolName]);
        address nftPoolAddr = nftPools[poolName];
        require(insPool != address(0) && nftPoolAddr != address(0), "Pool does not exist");

        // Revoke minter roles from both pools
        graviCha.removeMinter(insPool);
        graviCha.removeMinter(nftPoolAddr);

        // Remove from mappings
        delete insurancePools[poolName];
        delete nftPools[poolName];

        emit InsuranceRemoved(poolName, insPool);
        emit NFTPoolRemoved(nftPoolAddr);
    }

    function getPoolAddresses(string memory poolName) external view returns (address insurancePoolAddress, address nftPoolAddress) {
        insurancePoolAddress = address(insurancePools[poolName]);
        nftPoolAddress = nftPools[poolName];
    }

    function getAllInsurancePoolNames() external view returns (string[] memory) {
        return insurancePoolNames;
    }

    function monthlyMintNFTForPool(string memory poolName, string[] calldata tokenURIs) external onlyGovernance {
        address nftPoolAddress = nftPools[poolName];
        require(nftPoolAddress != address(0), "NFT pool not found");
        IGraviPoolNFT pool = IGraviPoolNFT(nftPoolAddress);
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            pool.mintToPool(nftPoolAddress, tokenURIs[i]);
            pool.startAuction(tokenURIs[i]);
        }
        // lastNFTPoolMint = block.timestamp;
    }

    /// @notice Move Ether from an insurance pool to a recipient address. For emergency use.
    function moveEtherFromInsurance(
        string memory insuranceName, 
        address payable recipient, 
        uint256 amount
    ) external onlyGovernance nonReentrant {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        // Assuming the insurance contract has a transferEther function callable by its owner (the DAO)
        insurance.transferEther(recipient, amount);
    }

    // ---------------------------------------------------
    // 3. Insurance Disaster Event Recording and Management
    // ---------------------------------------------------
    function recordDisasterEvent(
        string memory insuranceName,
        string memory eventName,
        string memory eventDescription,
        string[] calldata approvedCities,
        string[] calldata approvedProvinces,
        string calldata approvedCountry,
        string calldata autoPayoutGranularity, // e.g.: "City", "Province", "Country", "None", None indicates manual payout.
        uint256 disasterDate,
        uint256 donationAmount, // In ETH
        address[] calldata initialModerators
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.addDisasterEvent(
            eventName,
            eventDescription,
            approvedCities,
            approvedProvinces,
            approvedCountry,
            autoPayoutGranularity,
            disasterDate,
            donationAmount,
            initialModerators
        );
    }

    function updateDonationAmount(
        string memory insuranceName,
        string memory eventId,
        uint256 newDonationAmount
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.modifyDonationAmount(eventId, newDonationAmount);
    }

    function modifyDisasterEvent(
        string memory insuranceName,
        string memory eventId, // Identifier for the event to modify
        string memory newEventDescription,
        string[] calldata newApprovedCities,
        string[] calldata newApprovedProvinces,
        string calldata newApprovedCountry,
        string calldata newAutoPayoutGranularity,
        uint256 newDisasterDate
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.modifyDisasterEvent(
            eventId,
            newEventDescription,
            newApprovedCities,
            newApprovedProvinces,
            newApprovedCountry,
            newAutoPayoutGranularity,
            newDisasterDate
        );
    }

    function removeDisasterEvent(string memory insuranceName, string memory eventId) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.removeDisasterEvent(eventId);
    }

    function addClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.addClaimModerator(eventId, moderator);
    }

    function removeClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.removeClaimModerator(eventId, moderator);
    }

    // ---------------------------------------------------
    // 4. Staking for GraviGov Tokens and Voting Rewards
    // ---------------------------------------------------
    // Update a staker's reward balance based on the time elapsed
    function updateReward(address account) internal {
        uint256 timeDiff = block.timestamp - lastRewardUpdate[account];
        if (stakedGov[account] > 0) {
            stakingRewardBalance[account] += stakedGov[account] * timeDiff * stakingRewardRate;
        }
        lastRewardUpdate[account] = block.timestamp;
    }

    function stakeGovTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        updateReward(msg.sender);
        require(graviGov.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakedGov[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstakeGovTokens(uint256 amount) external {
        require(amount > 0 && amount <= stakedGov[msg.sender], "Invalid unstake amount");
        updateReward(msg.sender);
        stakedGov[msg.sender] -= amount;
        require(graviGov.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    function claimStakingRewards() external {
        updateReward(msg.sender);
        uint256 reward = stakingRewardBalance[msg.sender];
        require(reward > 0, "No rewards available");
        stakingRewardBalance[msg.sender] = 0;
        graviCha.mint(msg.sender, reward);
        emit StakingRewardClaimed(msg.sender, reward);
    }

    function setStakingRewardRate(uint256 newRate) external onlyGovernance {
        stakingRewardRate = newRate;
    }

    // function _castVote(
    //     uint256 proposalId,
    //     address account,
    //     uint8 support,
    //     string memory reason
    // ) internal virtual override returns (uint256) {
    //     // Call the parent _castVote implementation using default params
    //     uint256 voteResult = super._castVote(proposalId, account, support, reason);
    //     // Award vote reward if not already given for this proposal
    //     if (!voteRewarded[proposalId][account]) {
    //         voteRewarded[proposalId][account] = true;
    //         graviCha.mint(account, voteRewardAmount);
    //     }

    //     return voteResult;
    // }

    // function setVoteRewardAmount(uint256 newAmount) external onlyGovernance {
    //     voteRewardAmount = newAmount;
    // }

    // ---------------------------------------------------
    // 5. GraviCha Token Management
    // ---------------------------------------------------
    function addCharityMinterRole(address newMinter) external onlyGovernance {
        graviCha.addMinter(newMinter);
    }

    function removeCharityMinterRole(address minter) external onlyGovernance {
        graviCha.removeMinter(minter);
    }

    // ---------------------------------------------------
    // 6. Other important functions
    // ---------------------------------------------------
    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Arbitrary ether transfer function
    function transferEther(address payable recipient, uint256 amount) external onlyGovernance nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Ether transfer failed");
    }

    // function donateEtherToInsurance(string memory poolName, uint256 amount) external onlyGovernance nonReentrant {
    //     address insuranceAddr = address(insurancePools[poolName]);
    //     require(insuranceAddr != address(0), "Insurance pool not found");
    //     require(amount <= address(this).balance, "Insufficient balance");
    //     (bool success, ) = insuranceAddr.call{value: amount}("");
    //     require(success, "Donation transfer failed");
    // }

    // ---------------------------------------------------
    // 7. Dao override for Governor parameters
    // ---------------------------------------------------
    function setVotingDelay(uint256 newDelay) external onlyGovernance {
        govVotingDelay = newDelay;
    }

    function setVotingPeriod(uint256 newPeriod) external onlyGovernance {
        govVotingPeriod = newPeriod;
    }

    function setProposalThreshold(uint256 newThreshold) external onlyGovernance {
        govProposalThreshold = newThreshold;
    }

    // ---------------------------------------------------
    // Governance parameters required by Governor
    // ---------------------------------------------------
    function votingDelay() public view override returns (uint256) {
        return govVotingDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        return govVotingPeriod;
    }

    function proposalThreshold() public view override returns (uint256) {
        return govProposalThreshold;
    }

    // ---------------------------------------------------
    // Overrides required by Solidity.
    // ---------------------------------------------------
    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view virtual override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function verifyAndApproveClaim(bytes32 /*policyId*/) external pure returns (bool) {
        return true; // stub for now
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}