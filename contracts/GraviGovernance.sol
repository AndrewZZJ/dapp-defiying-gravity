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

contract GraviGovernance is IGraviGovernance, Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
    // Governance parameters.
    uint256 public govVotingDelay;
    uint256 public govVotingPeriod;
    uint256 public govProposalThreshold;

    // // Extended proposal metadata.
    // struct ProposalData {
    //     uint256 id;
    //     string title;
    //     string description;
    //     address[] targets;
    //     uint256[] values;
    //     bytes[] calldatas;
    //     address proposer;
    //     uint256 created;
    // }
    mapping(uint256 => ProposalData) public proposals;
    uint256[] public allProposalIds;

    // event GraviProposalCreated(uint256 indexed proposalId, string title, address proposer);

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

    function setGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold
    ) external onlyGovernance {
        govVotingDelay = newVotingDelay;
        govVotingPeriod = newVotingPeriod;
        govProposalThreshold = newProposalThreshold;
    }

    /// @notice Creates a proposal with extended metadata.
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

    function getAllProposalIds() external view returns (uint256[] memory) {
        return allProposalIds;
    }

    function getProposalDetail(uint256 proposalId) external view returns (ProposalData memory) {
        require(proposals[proposalId].proposer != address(0), "Proposal does not exist");
        return proposals[proposalId];
    }

    function getProposalCount() external view returns (uint256) {
        return allProposalIds.length;
    }

    // Governor-required overrides.
    function votingDelay() public view override returns (uint256) {
        return govVotingDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        return govVotingPeriod;
    }

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
