// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IGraviInsurance
 * @notice Interface for the GraviInsurance contract that handles disaster insurance policies and claims
 * @dev This interface defines functions for managing disaster events, insurance policies, claims, and donations
 */
interface IGraviInsurance {
    // ========================================
    // Disaster Event Management
    // ========================================

    /**
     * @notice Adds a new disaster event
     * @param eventName The name of the disaster event
     * @param eventDescription A description of the disaster event
     * @param disasterDate The date when the disaster occurred
     * @dev Only callable by the owner
     */
    function addDisasterEvent(
        string calldata eventName,
        string calldata eventDescription,
        uint256 disasterDate
    ) external;

    /**
     * @notice Modifies an existing disaster event
     * @param eventId The unique identifier of the event to modify
     * @param newName The new name for the event
     * @param newEventDescription The new description for the event
     * @param disasterDate The new date for the disaster
     * @dev Only callable by the owner
     */
    function modifyDisasterEvent(
        string calldata eventId,
        string calldata newName,
        string calldata newEventDescription,
        uint256 disasterDate
    ) external;

    /**
     * @notice Removes a disaster event
     * @param eventId The unique identifier of the event to remove
     * @dev Only callable by the owner
     */
    function removeDisasterEvent(
        string memory eventId
    ) external;


    // ========================================
    // Insurance Policy Management
    // ========================================

    /**
     * @notice Buys an insurance policy
     * @param startTime The start time of the insurance policy
     * @param coveragePeriod The duration of coverage in days
     * @param propertyAddress The address of the insured property
     * @param propertyValue The value of the property
     * @return The unique identifier for the policy
     * @dev Requires payment of premium in ETH
     */
    function buyInsurance(
        uint256 startTime,
        uint256 coveragePeriod,
        string memory propertyAddress,
        uint256 propertyValue
    ) external payable returns (bytes32);

    /**
     * @notice Retrieves the insurance policies of the caller
     * @return policyIds Array of policy identifiers
     * @return policyHolders Array of policy holder addresses
     * @return maxCoverageAmounts Array of maximum coverage amounts
     * @return premiums Array of premiums paid
     * @return startTimes Array of policy start times
     * @return endTimes Array of policy end times
     * @return isClaimedList Array of flags indicating if policies have been claimed
     * @return propertyAddresses Array of property addresses
     * @return propertyValues Array of property values
     */
    function getUserPolicies() external view returns (
        bytes32[] memory policyIds,
        address[] memory policyHolders,
        uint256[] memory maxCoverageAmounts,
        uint256[] memory premiums,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bool[] memory isClaimedList,
        string[] memory propertyAddresses,
        uint256[] memory propertyValues
    );

    /**
     * @notice Gets policy IDs for a given user
     * @param user The address of the user
     * @return Array of policy identifiers
     */
    function fetchInsuranceIds(address user) external view returns (bytes32[] memory);

    /**
     * @notice Calculates the insurance premium
     * @param propertyAddress The address of the property
     * @param propertyValue The value of the property
     * @param coveragePeriod The coverage period in days
     * @return The calculated premium amount
     */
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external view returns (uint256);

    /**
     * @notice Calculates the coverage amount based on property details
     * @param propertyAddress The address of the property
     * @param propertyValue The value of the property
     * @param coveragePeriod The coverage period in days
     * @return The calculated coverage amount
     */
    function calculateCoverageAmount(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external view returns (uint256);
    
    // ========================================
    // Claim Management
    // ========================================

    /**
     * @notice Starts a claim
     * @param eventId The identifier of the disaster event
     * @param policyId The identifier of the policy
     * @param incidentDescription A description of the incident
     * @return True if the claim was successfully started
     */
    function startAClaim(
        string memory eventId,
        bytes32 policyId,
        string memory incidentDescription
    ) external returns (bool);

    /**
     * @notice Processes a claim based on moderator votes
     * @param claimId The identifier of the claim
     * @dev Determines if a claim is accepted or denied based on moderator votes
     */
    function processClaim(uint256 claimId) external;

    /**
     * @notice Pays out a processed claim
     * @param claimId The identifier of the claim
     * @dev Only owner can call this function
     */
    function payoutClaim(uint256 claimId) external;

    /**
     * @notice Allows a moderator to assess a claim
     * @param claimId The identifier of the claim
     * @param isApproved Whether the claim is approved
     * @param amount The approved payout amount
     */
    function assessClaim(uint256 claimId, bool isApproved, uint256 amount) external;

    /**
     * @notice Allows a user to cancel their claim if it's still in Pending status
     * @param claimId The ID of the claim to cancel
     * @return success True if the claim was successfully canceled
     */
    function cancelClaim(uint256 claimId) external returns (bool success);

    /**
     * @notice Gets the claims associated with the caller
     * @return claimIds Array of claim identifiers
     * @return policyIds Array of associated policy identifiers
     * @return moderators Array of moderator arrays for each claim
     * @return statuses Array of claim statuses
     * @return descriptions Array of incident descriptions
     */
    function getUserClaims() external view returns (
        uint256[] memory claimIds,
        bytes32[] memory policyIds,
        address[][] memory moderators,
        string[] memory statuses,
        string[] memory descriptions
    );

    /**
     * @notice Gets moderators for a specific claim
     * @param claimId The identifier of the claim
     * @return Array of moderator addresses
     */
    function getClaimModerators(uint256 claimId) external view returns (address[] memory);

    // ========================================
    // Moderator Management
    // ========================================

    /**
     * @notice Adds a moderator to the pool
     * @param moderator The address of the moderator
     * @param maxAmount The maximum amount the moderator can approve
     * @dev Only owner can call this function
     */
    function addModeratorToPool(address moderator, uint256 maxAmount) external;

    /**
     * @notice Removes a moderator from the pool
     * @param moderator The address of the moderator
     * @dev Only owner can call this function
     */
    function removeModeratorFromPool(address moderator) external;

    // ========================================
    // Donation and Fund Management
    // ========================================

    /**
     * @notice Donates ETH to the pool and receives tokens/NFT
     * @return tokensReceived The amount of charity tokens received
     */
    function donate() external payable returns (uint256 tokensReceived);

    /**
     * @notice Transfers ether to a recipient
     * @param recipient The recipient address
     * @param amount The amount to transfer
     * @dev Only owner can call this function
     */
    function transferEther(address payable recipient, uint256 amount) external payable;

    /**
     * @notice Retrieves all donors and their total donated amounts
     * @return Array of donor addresses and array of corresponding donation amounts
     */
    function getAllDonors() external view returns (address[] memory, uint256[] memory);

    /**
     * @notice Retrieves the top 10 highest donors
     * @return Array of donor addresses and array of corresponding donation amounts
     */
    function getTopDonors() external view returns (address[] memory, uint256[] memory);

    /**
     * @notice Gets details of a specific policy
     * @param policyId The identifier of the policy
     * @return _policyId The unique identifier of the policy
     * @return _policyHolder The address of the policyholder
     * @return _maxCoverageAmount The maximum coverage amount of the policy
     * @return _premiumPaid The premium amount paid for the policy
     * @return _startTime The start time of the policy
     * @return _endTime The end time of the policy
     * @return _isClaimed The claim status of the policy
     * @return _propertyAddress The address of the insured property
     * @return _propertyValue The value of the insured property
     */
    function getUserPolicy(bytes32 policyId) external view returns (
            bytes32 _policyId,
            address _policyHolder,
            uint256 _maxCoverageAmount,
            uint256 _premiumPaid,
            uint256 _startTime,
            uint256 _endTime,
            bool _isClaimed,
            string memory _propertyAddress,
            uint256 _propertyValue
    );

    /**
     * @notice Gets details of a disaster event
     * @param eventId The identifier of the event
     * @return eventName The name of the event
     * @return eventDescription The description of the event
     * @return disasterDate The date of the disaster
     */
    function getDisasterEvent(string memory eventId) external view returns (string memory eventName, string memory eventDescription, uint256 disasterDate);
    
    /**
     * @notice Gets all disaster events
     * @return eventIds Array of event identifiers
     */
    function getAllDisasterEvents() external view returns (string[] memory eventIds);

    /**
     * @notice Gets claim IDs for a specific user
     * @param user The address of the user
     * @return Array of claim identifiers
     */
    function fetchClaimIds(address user) external view returns (uint256[] memory);
    
    /**
     * @notice Gets detailed information about a specific claim
     * @param claimId The identifier of the claim
     * @return _claimId The identifier of the claim
     * @return _policyId The identifier of the associated policy
     * @return _eventId The identifier of the event related to the claim
     * @return _approvedClaimAmount The amount approved for the claim
     * @return _assessmentStart The timestamp when the assessment started
     * @return _assessmentEnd The timestamp when the assessment ended
     * @return _status The current status of the claim
     * @return _incidentDescription A description of the incident related to the claim
     * @return moderatorAddresses The addresses of the moderators involved in the assessment
     * @return hasDecidedList A list indicating whether each moderator has made a decision
     * @return isApprovedList A list indicating whether each moderator approved the claim
     * @return approvedAmounts A list of amounts approved by each moderator
     */
    function getClaimDetails(uint256 claimId) external view returns (
        uint256 _claimId,
        bytes32 _policyId,
        string memory _eventId,
        uint256 _approvedClaimAmount,
        uint256 _assessmentStart,
        uint256 _assessmentEnd,
        string memory _status,
        string memory _incidentDescription,
        address[] memory moderatorAddresses,
        bool[] memory hasDecidedList,
        bool[] memory isApprovedList,
        uint256[] memory approvedAmounts
    );
}
