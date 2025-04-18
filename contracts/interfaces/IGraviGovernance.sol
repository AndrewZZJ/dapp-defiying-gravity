// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IGraviGovernance
 * @notice Interface for the GraviGovernance contract that manages governance proposals and voting
 * @dev Defines functions for creating, tracking, and managing governance proposals
 */
interface IGraviGovernance {
    /**
     * @notice Structure that holds extended metadata for proposals
     * @param id The unique proposal identifier
     * @param title A short title for the proposal
     * @param description A detailed description of the proposal
     * @param targets The list of target addresses for function calls
     * @param values The list of ETH values to be sent with each call
     * @param calldatas The list of encoded function calls
     * @param proposer The address that submitted the proposal
     * @param created The timestamp when the proposal was created
     */
    struct ProposalData {
        uint256 id;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        address proposer;
        uint256 created;
    }

    /**
     * @notice Event emitted when a new proposal is created
     * @param proposalId The unique identifier of the proposal
     * @param title The title of the proposal
     * @param proposer The address of the user who created the proposal
     */
    event GraviProposalCreated(uint256 indexed proposalId, string title, address proposer);
    
    /**
     * @notice Event emitted when a vote reward is claimed
     * @param voter The address of the voter
     * @param proposalId The ID of the proposal that was voted on
     * @param amount The amount of reward tokens claimed
     */
    event VoteRewardClaimed(address indexed voter, uint256 indexed proposalId, uint256 amount);
    
    /**
     * @notice Event emitted when the vote reward amount is updated
     * @param oldAmount The previous reward amount
     * @param newAmount The new reward amount
     */
    event VoteRewardAmountUpdated(uint256 oldAmount, uint256 newAmount);
    
    /**
     * @notice Event emitted when rewards are enabled or disabled
     * @param enabled Whether rewards are enabled
     */
    event VoteRewardsToggled(bool enabled);
    
    /**
     * @notice Event emitted when a proposal creation reward is claimed
     * @param proposer The address of the proposer
     * @param proposalId The ID of the proposal that was created
     * @param amount The amount of reward tokens claimed
     */
    event ProposalCreationRewardClaimed(address indexed proposer, uint256 indexed proposalId, uint256 amount);

    // ---------------------------
    // Governance Parameter Methods
    // ---------------------------

    /**
     * @notice Updates the governance parameters
     * @param newVotingDelay The new voting delay in blocks before voting begins
     * @param newVotingPeriod The new duration in blocks for which voting remains open
     * @param newProposalThreshold The new minimum number of votes required to propose
     * @dev Only callable by the governance (timelock) contract
     */
    function setGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold
    ) external;

    // ---------------------------
    // Proposal Management Methods
    // ---------------------------

    /**
     * @notice Creates a new proposal with extended metadata
     * @param title The title of the proposal
     * @param description The detailed proposal description
     * @param targets An array of target contract addresses for the proposal actions
     * @param values An array of ETH amounts to be sent with each call
     * @param calldatas An array of encoded function calls corresponding to each target
     * @return proposalId The unique identifier assigned to the new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId);
    
    /**
     * @notice Creates a new proposal with extended metadata and claims a reward
     * @param title The title of the proposal
     * @param description The detailed proposal description
     * @param targets An array of target contract addresses for the proposal actions
     * @param values An array of ETH amounts to be sent with each call
     * @param calldatas An array of encoded function calls corresponding to each target
     * @return proposalId The unique identifier assigned to the new proposal
     */
    function createProposalWithReward(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId);

    /**
     * @notice Returns an array of all proposal IDs that have been created
     * @return An array containing the IDs of all proposals
     */
    function getAllProposalIds() external view returns (uint256[] memory);

    /**
     * @notice Retrieves the detailed metadata for a specific proposal
     * @param proposalId The unique identifier of the proposal
     * @return A ProposalData struct containing the proposal's details
     */
    function getProposalDetail(uint256 proposalId) external view returns (ProposalData memory);

    /**
     * @notice Returns the total number of proposals that have been created
     * @return The count of proposals
     */
    function getProposalCount() external view returns (uint256);
    
    // ---------------------------
    // Voting and Rewards Methods
    // ---------------------------
    
    /**
     * @notice Casts a vote on a proposal and rewards the voter
     * @param proposalId The ID of the proposal to vote on
     * @param support The type of support (0=Against, 1=For, 2=Abstain)
     * @return The weight of the vote
     */
    function castVoteWithReward(uint256 proposalId, uint8 support) external returns (uint256);
    
    /**
     * @notice Casts a vote with reason and rewards the voter
     * @param proposalId The ID of the proposal to vote on
     * @param support The type of support (0=Against, 1=For, 2=Abstain)
     * @param reason The reason for the vote
     * @return The weight of the vote
     */
    function castVoteWithReasonAndReward(
        uint256 proposalId, 
        uint8 support, 
        string calldata reason
    ) external returns (uint256);
    
    /**
     * @notice Enables or disables vote rewards
     * @param enabled Whether rewards should be enabled
     */
    function toggleVoteRewards(bool enabled) external;
    
    /**
     * @notice Updates the reward amount for voting
     * @param newAmount The new reward amount in wei
     */
    function setVoteRewardAmount(uint256 newAmount) external;
    
    /**
     * @notice Checks if a voter has already claimed a reward for a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return Whether the voter has claimed a reward for this proposal
     */
    function hasVoterClaimedReward(uint256 proposalId, address voter) external view returns (bool);
    
    /**
     * @notice Returns the current reward information
     * @return isEnabled Whether rewards are currently enabled
     * @return rewardAmount The current reward amount in wei
     * @return tokenAddress The address of the reward token
     */
    function getRewardInfo() external view returns (
        bool isEnabled, 
        uint256 rewardAmount, 
        address tokenAddress
    );
}
