// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IGraviDisasterOracle {
    function validateClaim(
        string calldata incidentDescription,
        string calldata disasterType,
        string calldata evidence
    ) external returns (bool);
}
