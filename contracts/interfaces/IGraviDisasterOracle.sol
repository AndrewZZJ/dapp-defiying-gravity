// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IGraviDisasterOracle
 * @notice Interface for the disaster oracle that validates insurance claims
 * @dev Provides external validation for disaster-related insurance claims
 */
interface IGraviDisasterOracle {
    /**
     * @notice Validates a claim based on provided information
     * @param incidentDescription Description of the incident
     * @param disasterType Type of disaster that occurred
     * @param evidence Evidence supporting the claim
     * @return True if the claim is valid, false otherwise
     */
    function validateClaim(
        string calldata incidentDescription,
        string calldata disasterType,
        string calldata evidence
    ) external returns (bool);
}
