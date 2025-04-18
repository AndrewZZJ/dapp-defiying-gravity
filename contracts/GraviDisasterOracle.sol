// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";

/**
 * @title GraviDisasterOracle
 * @notice A simple implementation of a disaster oracle for validating insurance claims
 * @dev This is a trivial oracle for demo purposes that validates if all required information is present
 */
contract GraviDisasterOracle is IGraviDisasterOracle {
    /**
     * @notice Event emitted after a claim validation is performed
     * @param incidentDescription Description of the incident
     * @param disasterType Type of disaster that occurred
     * @param evidence Evidence supporting the claim
     * @param isValid Whether the claim is valid
     */
    event ClaimValidated(
        string incidentDescription,
        string disasterType,
        string evidence,
        bool isValid
    );

    /**
     * @notice Validates a claim based on provided information
     * @param incidentDescription Description of the incident
     * @param disasterType Type of disaster that occurred
     * @param evidence Evidence supporting the claim
     * @return valid True if the claim is valid, false otherwise
     * @dev A claim is valid if all three input parameters have content
     */
    function validateClaim(
        string memory incidentDescription,
        string memory disasterType,
        string memory evidence
    ) external returns (bool) {
        bool valid;
        if (
            bytes(incidentDescription).length == 0 ||
            bytes(disasterType).length == 0 ||
            bytes(evidence).length == 0
        ) {
            valid = false;
        } else {
            valid = true;
        }
        emit ClaimValidated(incidentDescription, disasterType, evidence, valid);
        return valid;
    }
}
