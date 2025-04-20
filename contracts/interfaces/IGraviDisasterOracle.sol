// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IGraviDisasterOracle
 * @notice Interface for the disaster oracle that validates insurance claims
 * @dev Provides external validation for disaster-related insurance claims
 */
interface IGraviDisasterOracle {
    /**
     * @notice Event emitted after a disaster type is validated
     * @param disasterType The submitted disaster type
     * @param isValid Whether the type is whitelisted
     */
    event DisasterTypeValidated(string disasterType, bool isValid);
    
    /**
     * @notice Event emitted when an address is validated
     * @param propertyAddress The address being validated
     * @param isValid Whether the address is valid
     */
    event AddressValidated(string propertyAddress, bool isValid);

    /**
     * @notice Validates a claim based on provided information
     * @param disasterType Disaster type
     * @return True if the claim is valid, false otherwise
     */
    function validateClaim(
        string memory disasterType
    ) external returns (bool);
    
    /**
     * @notice Validates if a property address is valid
     * @param propertyAddress The property address to validate
     * @return True if the address is valid, false otherwise
     */
    function validateAddress(
        string memory propertyAddress
    ) external pure returns (bool);
    
    /**
     * @notice Calculates insurance premium based on property details
     * @param propertyAddress The address of the property
     * @param propertyValue The value of the property in ETH
     * @param coveragePeriod The coverage period in days
     * @return premium The calculated premium amount in ETH
     */
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external pure returns (uint256 premium);
    
    /**
     * @notice Calculates coverage amount based on property details
     * @param propertyAddress The address of the property
     * @param propertyValue The value of the property in ETH
     * @param coveragePeriod The coverage period in days
     * @return coverageAmount The resulting coverage amount in ETH
     */
    function calculateCoverage(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external pure returns (uint256 coverageAmount);
    
    /**
     * @notice Calculates damage amount for a claim
     * @param policyId The ID of the policy
     * @param eventId The ID of the disaster event
     * @param propertyAddress The address of the property
     * @param coverageAmount The maximum coverage amount
     * @return damageAmount The calculated damage amount (percentage of max coverage)
     */
    function calculateDamage(
        bytes32 policyId,
        string memory eventId,
        string memory propertyAddress,
        uint256 coverageAmount
    ) external pure returns (uint256 damageAmount);
}
