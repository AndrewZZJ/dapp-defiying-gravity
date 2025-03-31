// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// HERE We should put the code for Gravi insurance oracle contract
// Could have 1 or more oracles
contract GraviDisasterOracle {
    // AJ: A very trival oracle for the purpose of demo.
    // check if we have all 3 information for a claim. If so, approve the claim. Otherwise, reject.
    function validateClaim(
        string memory incidentDescription,
        string memory disasterType,
        string memory evidence
    ) external pure returns (bool) {
        if (bytes(incidentDescription).length == 0 || bytes(disasterType).length == 0 || bytes(evidence).length == 0) {
            return false;
        }
        return true;
    }
}