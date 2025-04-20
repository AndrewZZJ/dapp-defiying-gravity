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
     * @param disasterType Disaster type
     * @return True if the claim is valid, false otherwise
     */
    function validateClaim(
        string memory disasterType
    ) external returns (bool);
}
