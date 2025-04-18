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

    /**
     * @notice Constructs the governance contract
     * @param token The voting token used for governance
     * @param timelock The timelock controller for delayed execution
     */
    constructor(IVotes token, TimelockController timelock)
        Governor("GraviGovernance")
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(timelock)
    {
        govVotingDelay = 0;       // Immediate voting start.
        govVotingPeriod = 50400;  // Example: 1 week in blocks. (12 seconds per block)
        govProposalThreshold = 1000; // At least 1000 votes required to propose.
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
