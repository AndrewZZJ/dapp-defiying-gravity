// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IGraviInsurance {
    // Add a new disaster event.
    function addDisasterEvent(
        string memory eventName,
        string memory eventDescription,
        string[] calldata approvedCities,
        string[] calldata approvedProvinces,
        string calldata approvedCountry,
        string calldata autoPayoutGranularity,
        uint256 disasterDate,
        uint256 donationAmount,
        address[] calldata initialModerators
    ) external;

    // Modify an existing disaster event identified by eventName (or an event ID if available).
    function modifyDisasterEvent(
        string memory eventId,
        string memory newEventDescription,
        string[] calldata newApprovedCities,
        string[] calldata newApprovedProvinces,
        string calldata newApprovedCountry,
        string calldata newAutoPayoutGranularity,
        uint256 newDisasterDate
    ) external;

    // Modify the donation amount allocated for a disaster event.
    function modifyDonationAmount(
        string memory eventId, 
        uint256 newDonationAmount
    ) external;

    // Remove a disaster event.
    function removeDisasterEvent(
        string memory eventId
    ) external;

    // Add a claim moderator for a given disaster event.
    function addClaimModerator(
        string memory eventId,
        address moderator
    ) external;

    // Remove a claim moderator for a given disaster event.
    function removeClaimModerator(
        string memory eventId,
        address moderator
    ) external;

    // Transfer ether to a recipient.
    function transferEther(address payable recipient, uint256 amount) external payable;
} 
        