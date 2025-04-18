// GraviGovernance.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import {IGraviGovernance} from "./interfaces/IGraviGovernance.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";

/**
 * @title GraviGovernance
 * @notice Implementation of the governance system for the protocol
 * @dev Extends OpenZeppelin's Governor contract with custom functionality
 */
contract GraviGovernance is IGraviGovernance, Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
    // Governance parameters.
    uint256 public govVotingDelay;
    uint256 public govVotingPeriod;
    uint256 public govProposalThreshold;

    // Extended proposal metadata mapping
    mapping(uint256 => ProposalData) public proposals;
    uint256[] public allProposalIds;
    
    // Token reward configuration
    IGraviCha public immutable graviCha;
    uint256 public voteRewardAmount = 0.1 ether; // Default 0.1 GraviCha tokens (in wei)
    bool public rewardsEnabled = true;
    
    // Track which addresses have claimed rewards for which proposals
    mapping(uint256 => mapping(address => bool)) public hasClaimedReward;
    mapping(uint256 => bool) public hasProposerClaimedReward;

    /**
     * @notice Constructs the governance contract
     * @param token The voting token used for governance
     * @param timelock The timelock controller for delayed execution
     * @param _graviCha The GraviCha token used for rewards
     */
    constructor(
        IVotes token, 
        TimelockController timelock,
        IGraviCha _graviCha
    )
        Governor("GraviGovernance")
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(timelock)
    {
        govVotingDelay = 0;       // Immediate voting start.
        govVotingPeriod = 50400;  // Example: 1 week in blocks. (12 seconds per block)
        govProposalThreshold = 1000; // At least 1000 votes required to propose.
        graviCha = _graviCha;
    }
    
    /**
     * @notice Updates the reward amount for voting
     * @param newAmount The new reward amount in wei
     * @dev Only callable by governance
     */
    function setVoteRewardAmount(uint256 newAmount) external onlyGovernance {
        uint256 oldAmount = voteRewardAmount;
        voteRewardAmount = newAmount;
        emit VoteRewardAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @notice Enables or disables vote rewards
     * @param enabled Whether rewards should be enabled
     * @dev Only callable by governance
     */
    function toggleVoteRewards(bool enabled) external onlyGovernance {
        rewardsEnabled = enabled;
        emit VoteRewardsToggled(enabled);
    }

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
    ) external onlyGovernance {
        govVotingDelay = newVotingDelay;
        govVotingPeriod = newVotingPeriod;
        govProposalThreshold = newProposalThreshold;
    }

    /**
     * @notice Override default proposal creation to include extended metadata
     * @param targets An array of target contract addresses
     * @param values An array of ETH amounts to be sent with each call
     * @param calldatas An array of encoded function calls
     * @param description The proposal description
     * @return The unique identifier assigned to the new proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        // Call the base propose function.
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        
        // Store the proposal metadata.
        proposals[proposalId] = ProposalData({
            id: proposalId,
            title: "",
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas,
            proposer: msg.sender,
            created: block.timestamp
        });
        
        allProposalIds.push(proposalId);
        emit GraviProposalCreated(proposalId, "", msg.sender);
        
        return proposalId;
    }

    /**
     * @notice Creates a proposal with extended metadata
     * @param title A short title for the proposal
     * @param description A detailed description of the proposal
     * @param targets An array of target contract addresses
     * @param values An array of ETH amounts to be sent with each call
     * @param calldatas An array of encoded function calls
     * @return proposalId The unique identifier assigned to the new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId) {
        // Use the base Governor propose function.
        proposalId = super.propose(targets, values, calldatas, description);
        proposals[proposalId] = ProposalData({
            id: proposalId,
            title: title,
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas,
            proposer: msg.sender,
            created: block.timestamp
        });
        allProposalIds.push(proposalId);
        emit GraviProposalCreated(proposalId, title, msg.sender);
    }
    
    /**
     * @notice Creates a proposal with extended metadata and claims a reward
     * @param title A short title for the proposal
     * @param description A detailed description of the proposal
     * @param targets An array of target contract addresses
     * @param values An array of ETH amounts to be sent with each call
     * @param calldatas An array of encoded function calls
     * @return proposalId The unique identifier assigned to the new proposal
     */
    function createProposalWithReward(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId) {
        // Use the base Governor propose function.
        proposalId = super.propose(targets, values, calldatas, description);
        proposals[proposalId] = ProposalData({
            id: proposalId,
            title: title,
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas,
            proposer: msg.sender,
            created: block.timestamp
        });
        allProposalIds.push(proposalId);
        
        // Issue reward if enabled
        if (rewardsEnabled && address(graviCha) != address(0)) {
            hasProposerClaimedReward[proposalId] = true;
            
            // Try to mint the reward tokens to the proposer
            try graviCha.mint(msg.sender, voteRewardAmount) {
                emit ProposalCreationRewardClaimed(msg.sender, proposalId, voteRewardAmount);
            } catch {
                // If minting fails, we still keep the proposal but no reward is issued
            }
        }
        
        emit GraviProposalCreated(proposalId, title, msg.sender);
    }
    
    /**
     * @notice Casts a vote on a proposal and rewards the voter with GraviCha tokens
     * @param proposalId The ID of the proposal to vote on
     * @param support The type of support (0=Against, 1=For, 2=Abstain)
     * @return The weight of the vote
     */
    function castVoteWithReward(uint256 proposalId, uint8 support) external returns (uint256) {
        // Cast the vote using the standard castVote function
        uint256 weight = castVote(proposalId, support);
        
        // Issue reward if enabled and not already claimed
        _issueRewardIfEligible(proposalId, msg.sender);
        
        return weight;
    }
    
    /**
     * @notice Casts a vote with reason and rewards the voter with GraviCha tokens
     * @param proposalId The ID of the proposal to vote on
     * @param support The type of support (0=Against, 1=For, 2=Abstain)
     * @param reason The reason for the vote
     * @return The weight of the vote
     */
    function castVoteWithReasonAndReward(
        uint256 proposalId, 
        uint8 support, 
        string calldata reason
    ) external returns (uint256) {
        // Cast the vote using the standard castVoteWithReason function
        uint256 weight = castVoteWithReason(proposalId, support, reason);
        
        // Issue reward if enabled and not already claimed
        _issueRewardIfEligible(proposalId, msg.sender);
        
        return weight;
    }
    
    /**
     * @notice Issues a reward to the voter if eligible
     * @param proposalId The ID of the proposal that was voted on
     * @param voter The address of the voter
     * @dev Internal function to handle reward issuance logic
     */
    function _issueRewardIfEligible(uint256 proposalId, address voter) internal {
        // Check if rewards are enabled and voter hasn't already claimed for this proposal
        if (!rewardsEnabled || hasClaimedReward[proposalId][voter] || address(graviCha) == address(0)) {
            return;
        }
        
        // Mark as claimed before transferring to prevent reentrancy
        hasClaimedReward[proposalId][voter] = true;
        
        // Try to mint the reward tokens to the voter
        try graviCha.mint(voter, voteRewardAmount) {
            emit VoteRewardClaimed(voter, proposalId, voteRewardAmount);
        } catch {
            // If minting fails, we still keep the vote but no reward is issued
            // We don't revert to ensure the voting functionality still works
        }
    }

    /**
     * @notice Returns an array of all proposal IDs that have been created
     * @return An array containing the IDs of all proposals
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return allProposalIds;
    }

    /**
     * @notice Retrieves the detailed metadata for a specific proposal
     * @param proposalId The unique identifier of the proposal
     * @return A ProposalData struct containing the proposal's details
     */
    function getProposalDetail(uint256 proposalId) external view returns (ProposalData memory) {
        require(proposals[proposalId].proposer != address(0), "Proposal does not exist");
        return proposals[proposalId];
    }

    /**
     * @notice Returns the total number of proposals that have been created
     * @return The count of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return allProposalIds.length;
    }
    
    /**
     * @notice Checks if a voter has already claimed a reward for a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return Whether the voter has claimed a reward for this proposal
     */
    function hasVoterClaimedReward(uint256 proposalId, address voter) external view returns (bool) {
        return hasClaimedReward[proposalId][voter];
    }
    
    /**
     * @notice Returns the current reward information
     * @return isEnabled Whether rewards are currently enabled
     * @return rewardAmount The current reward amount in wei
     * @return tokenAddress The address of the GraviCha token
     */
    function getRewardInfo() external view returns (
        bool isEnabled, 
        uint256 rewardAmount, 
        address tokenAddress
    ) {
        return (rewardsEnabled, voteRewardAmount, address(graviCha));
    }

    /**
     * @notice Returns the delay in blocks before voting on a proposal begins
     * @return The voting delay in blocks
     */
    function votingDelay() public view override returns (uint256) {
        return govVotingDelay;
    }

    /**
     * @notice Returns the duration in blocks during which voting is open
     * @return The voting period in blocks
     */
    function votingPeriod() public view override returns (uint256) {
        return govVotingPeriod;
    }

    /**
     * @notice Returns the minimum number of votes required to create a proposal
     * @return The proposal threshold
     */
    function proposalThreshold() public view override returns (uint256) {
        return govProposalThreshold;
    }

    // The following overrides ensure compatibility with the timelock.
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
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
