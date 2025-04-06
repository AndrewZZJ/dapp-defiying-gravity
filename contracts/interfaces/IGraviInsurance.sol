// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IGraviInsurance {
    // Add a new disaster event.
    function addDisasterEvent(
        string calldata eventName,
        string calldata eventDescription,
        uint256 disasterDate,
        address[] calldata initialModerators
    ) external;

    // Modify an existing disaster event identified by eventName (or an event ID if available).
    function modifyDisasterEvent(
        string calldata eventId,
        string calldata newName,
        string calldata newEventDescription,
        uint256 disasterDate
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

    // buyInsurance allows a user to purchase an insurance policy by sending ETH.
    // It returns a bytes32 policyId.
    function buyInsurance(
        uint256 startTime,      // Unix timestamp in seconds
        uint256 coveragePeriod, // Coverage period in days
        string memory propertyAddress,
        uint256 propertyValue
    ) external payable returns (bytes32);

     // Returns the insurance (policy) details for the user.
    function getUserPolicies() external view returns (
        address user,
        bytes32[] memory policyIds,
        string[] memory propertyAddresses,
        uint256[] memory coverageAmounts,
        uint256[] memory coverageEndDates,
        string[] memory insuranceTypes
    );

    // donate allows a user to donate ETH and receive tokens.
    function donate() external payable;


    // Calculates a mock insurance premium based on a property’s address, its value (in ETH), and a coverage period (in days).
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external pure returns (uint256);

    // Transfer ether to a recipient.
    function transferEther(address payable recipient, uint256 amount) external payable;

    // AJ: need a method getting all claims for page:Claims -> View Claims
    // input: N/A
    // output: a list of claims. (might need to change format here)
    function getAllClaims() external view returns (uint[] memory, string[] memory, string[] memory, string[] memory); 

    // AJ: not 100% sure if we need an additional method for starting a claim.
    // input: incident description, disaster type, and evidence.
    // output: boolean
    // this method is expected to: start a claim (or preprocess the data for Moderator?), calls addClaimModerator, and returns if a claim is submitted successfully.
    function startAClaim(string memory incidentDescription, string memory disasterType) external returns (bool);
    
    // AJ: a method getting highest donors
    // input: N/A
    // output: a list of highest donors. (might need to change format here)
    //function getHighestDonors() external view returns (address[] memory, uint256[] memory);

    function getClaimModerators(
                string calldata eventId
        ) external view returns (address[] memory);
} 


        