// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

interface IGraviDAO is IGovernor {
    /// @notice Returns the delay before voting starts.
    function monthlyMint() external pure returns (uint256);

    // /// @notice Returns the voting period.
    // function votingPeriod() external pure returns (uint256);

    // /// @notice Returns the proposal threshold.
    // function proposalThreshold() external pure returns (uint256);

    // /// @notice Returns the state of a proposal.
    // /// @param proposalId The proposal identifier.
    // function state(uint256 proposalId) external view returns (ProposalState);

    // /// @notice Indicates whether a proposal needs queuing.
    // /// @param proposalId The proposal identifier.
    // function proposalNeedsQueuing(uint256 proposalId) external view returns (bool);

    // /// @notice Determines if a policy is eligible for payout
    // /// @param policyId The hash ID of the insurance policy
    // /// @return approved True if policy is eligible for payout
    function verifyAndApproveClaim(bytes32 policyId) external view returns (bool);
}