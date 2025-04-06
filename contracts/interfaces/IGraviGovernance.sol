// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IGraviGovernance
/// @notice Interface for the GraviGovernance contract to interact with its governance functions and metadata.
interface IGraviGovernance {
    /// @notice Structure that holds extended metadata for proposals.
    /// @param id The unique proposal identifier.
    /// @param title A short title for the proposal.
    /// @param description A detailed description of the proposal.
    /// @param targets The list of target addresses for function calls.
    /// @param values The list of ETH values (if any) to be sent with each call.
    /// @param calldatas The list of encoded function calls.
    /// @param proposer The address that submitted the proposal.
    /// @param created The timestamp when the proposal was created.
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

    /// @notice Event emitted when a new proposal is created.
    /// @param proposalId The unique identifier of the proposal.
    /// @param title The title of the proposal.
    /// @param proposer The address of the user who created the proposal.
    event GraviProposalCreated(uint256 indexed proposalId, string title, address proposer);

    // ---------------------------
    // Governance Parameter Methods
    // ---------------------------

    /// @notice Updates the governance parameters.
    /// @dev Only callable by the governance (timelock) contract.
    /// @param newVotingDelay The new voting delay in blocks before voting begins.
    /// @param newVotingPeriod The new duration in blocks for which voting remains open.
    /// @param newProposalThreshold The new minimum number of votes required to propose.
    function setGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold
    ) external;

    // ---------------------------
    // Proposal Management Methods
    // ---------------------------

    /// @notice Creates a new proposal with extended metadata.
    /// @param title The title of the proposal.
    /// @param description The detailed proposal description.
    /// @param targets An array of target contract addresses for the proposal actions.
    /// @param values An array of ETH amounts to be sent with each call.
    /// @param calldatas An array of encoded function calls corresponding to each target.
    /// @return proposalId The unique identifier assigned to the new proposal.
    function createProposal(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId);

    /// @notice Returns an array of all proposal IDs that have been created.
    /// @return An array containing the IDs of all proposals.
    function getAllProposalIds() external view returns (uint256[] memory);

    /// @notice Retrieves the detailed metadata for a specific proposal.
    /// @param proposalId The unique identifier of the proposal.
    /// @return A ProposalData struct containing the proposal’s details.
    function getProposalDetail(uint256 proposalId) external view returns (ProposalData memory);

    /// @notice Returns the total number of proposals that have been created.
    /// @return The count of proposals.
    function getProposalCount() external view returns (uint256);
}
