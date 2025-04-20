// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";

/**
 * @title GraviDisasterOracle
 * @notice A simplified oracle that verifies disaster type against a whitelist
 */
contract GraviDisasterOracle is IGraviDisasterOracle {
    /**
     * @notice Event emitted after a disaster type is validated
     * @param disasterType The submitted disaster type
     * @param isValid Whether the type is whitelisted
     */
    event DisasterTypeValidated(string disasterType, bool isValid);

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
}
