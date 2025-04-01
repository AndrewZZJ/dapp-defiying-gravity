// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";

// This is a trivial oracle for demo purposes.
// It checks if all 3 pieces of claim information are provided.
// If any are missing, it returns false (claim rejected); otherwise, it returns true (claim approved).
contract GraviDisasterOracle {
    // Event emitted after a claim validation is performed.
    event ClaimValidated(
        string incidentDescription,
        string disasterType,
        string evidence,
        bool isValid
    );

    // AJ: might need another oracle for validating a proposal.

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
