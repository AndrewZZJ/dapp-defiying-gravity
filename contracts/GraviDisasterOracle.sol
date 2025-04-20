// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";

/**
 * @title GraviDisasterOracle
 * @notice A simplified oracle that verifies disaster type against a whitelist
 */
contract GraviDisasterOracle is IGraviDisasterOracle {
    /**
     * @notice Validates the disaster type against a fixed whitelist
     * @param disasterType Type of disaster (e.g., "FIRE", "FLOOD", "EARTHQUAKE")
     * @return valid True if the disaster type is allowed
     */
    function validateClaim(
        string memory disasterType
    ) external returns (bool valid) {
        valid = _isWhitelistedDisasterType(disasterType);
        emit DisasterTypeValidated(disasterType, valid);
        return valid;
    }

    /**
     * @dev Internal helper to check if the disaster type is whitelisted
     */
    function _isWhitelistedDisasterType(string memory disasterType) internal pure returns (bool) {
        bytes32 disasterHash = keccak256(abi.encodePacked(disasterType));
        return (
            disasterHash == keccak256("FIRE") ||
            disasterHash == keccak256("FLOOD") ||
            disasterHash == keccak256("EARTHQUAKE")
        );
    }
    
    /**
     * @notice Validates if the property address is valid
     * @param propertyAddress The property address to validate
     * @return isValid True if the address is valid, false otherwise
     */
    function validateAddress(
        string memory propertyAddress
    ) external pure returns (bool isValid) {
        // For mock purposes, we'll consider an address valid if it's not empty
        isValid = bytes(propertyAddress).length > 0;
        return isValid;
    }
    
    /**
     * @notice Calculates a mock insurance premium based on a property's address, its value (in ETH), and a coverage period (in days).
     * @param propertyAddress The address of the property (as a string).
     * @param propertyValue The value of the property in ETH.
     * @param coveragePeriod The coverage period in days.
     * @return premium The calculated premium amount in ETH.
     */
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,  // in ETH
        uint256 coveragePeriod  // in days
    ) external pure returns (uint256 premium) {
        // Generate a pseudo-random factor based on the property address.
        // This results in a number between 1 and 100.
        uint256 addressFactor = (uint256(keccak256(abi.encodePacked(propertyAddress))) % 100) + 1;
        
        // Use a simple formula:
        // premium = (propertyValue * coveragePeriod * addressFactor) / divisor
        // The divisor is chosen to adjust the scale of the premium.
        uint256 divisor = 4000000;
        
        premium = (propertyValue * coveragePeriod * addressFactor) / divisor;
    }
    
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
    ) external pure returns (uint256 coverageAmount) {
        // Use the full hash of the address for maximum entropy
        bytes32 addressHash = keccak256(abi.encodePacked(propertyAddress));
        
        // Extract various components from the hash to ensure high variance between different addresses
        uint256 component1 = uint256(uint8(addressHash[0]));
        uint256 component2 = uint256(uint8(addressHash[1]));
        uint256 component3 = uint256(uint8(addressHash[2]));
        
        // Create a highly variable risk factor (50-100%) based on first component
        uint256 riskFactor = 50 + (component1 % 51);
        
        // Create a period modifier based on second component (±20%)
        uint256 periodModifier = 90 + (component2 % 41); // 90% to 130%
        
        // Adjust property value impact based on third component
        uint256 valueModifier = 80 + (component3 % 41); // 80% to 120%
        
        // Combine all factors into a unique calculation
        coverageAmount = (propertyValue * riskFactor * periodModifier * coveragePeriod) / (100 * 100 * 365);
        
        // Apply value modifier
        coverageAmount = (coverageAmount * valueModifier) / 100;
        
        // Ensure minimum coverage is property-specific (10-15% of value)
        uint256 minPercentage = 10 + (uint256(uint8(addressHash[3])) % 6);
        uint256 minCoverage = (propertyValue * minPercentage) / 100;
        
        if (coverageAmount < minCoverage) {
            coverageAmount = minCoverage;
        }
        
        // Set maximum coverage with variability (70-80% of property value)
        uint256 maxPercentage = 70 + (uint256(uint8(addressHash[4])) % 11);
        uint256 maxCoverage = (propertyValue * maxPercentage) / 100;
        
        if (coverageAmount > maxCoverage) {
            coverageAmount = maxCoverage;
        }
    }
    
    /**
     * @notice Calculates damage amount for a claim based on policy and event
     * @param policyId The ID of the policy
     * @param eventId The ID of the disaster event
     * @param propertyAddress The address of the property
     * @param coverageAmount The maximum coverage amount
     * @return damageAmount The calculated damage amount (percentage of max coverage, 0-90%)
     */
    function calculateDamage(
        bytes32 policyId,
        string memory eventId,
        string memory propertyAddress,
        uint256 coverageAmount
    ) external pure returns (uint256 damageAmount) {
        // Simple mock calculation using hash of policy ID and event ID
        uint256 factor = uint256(keccak256(abi.encodePacked(policyId, eventId, propertyAddress))) % 100;
        // We'll return a percentage (0-90%) of the max possible damage
        // We limit to 90% to avoid complete loss in mocks
        uint256 percentage = (factor * 90) / 100;
        damageAmount = (coverageAmount * percentage) / 100;
    }
}
