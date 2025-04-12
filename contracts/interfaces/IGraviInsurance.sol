// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IGraviInsurance {
    // ========================================
    // Disaster Event Management
    // ========================================

    /// @notice Adds a new disaster event.
    function addDisasterEvent(
        string calldata eventName,
        string calldata eventDescription,
        uint256 disasterDate
    ) external;

    /// @notice Modifies an existing disaster event.
    function modifyDisasterEvent(
        string calldata eventId,
        string calldata newName,
        string calldata newEventDescription,
        uint256 disasterDate
    ) external;

    /// @notice Removes a disaster event.
    function removeDisasterEvent(
        string memory eventId
    ) external;


    // ========================================
    // Insurance Policy Management
    // ========================================

    /// @notice Buys an insurance policy.
    function buyInsurance(
        uint256 startTime,
        uint256 coveragePeriod,
        string memory propertyAddress,
        uint256 propertyValue
    ) external payable returns (bytes32);

    /// @notice Retrieves the insurance policies of the user.
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

    /// @notice Gets policy IDs for a given user.
    function fetchInsuranceIds(address user) external view returns (bytes32[] memory);

    /// @notice Calculates the insurance premium.
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 coveragePeriod
    ) external pure returns (uint256);

    /// @notice Calculates the coverage amount based on the premium.
    function calculateCoverageAmountFromPremium(uint256 premium) external pure returns (uint256);

    // ========================================
    // Claim Management
    // ========================================

    /// @notice Starts a claim.
    function startAClaim(
        string memory eventId,
        bytes32 policyId,
        string memory incidentDescription
    ) external returns (bool);

    /// @notice Processes a claim based on moderator votes.
    function processClaim(uint256 claimId) external;

    /// @notice Payouts a processed claim.
    function payoutClaim(uint256 claimId) external;

    /// @notice Allows a moderator to assess a claim.
    function assessClaim(uint256 claimId, bool isApproved, uint256 amount) external;

    /// @notice Gets the claims associated with the user.
    function getUserClaims() external view returns (
        uint256[] memory claimIds,
        bytes32[] memory policyIds,
        address[][] memory moderators,
        string[] memory statuses,
        string[] memory descriptions
    );

    /// @notice Gets moderators for a specific claim.
    function getClaimModerators(uint256 claimId) external view returns (address[] memory);

    // ========================================
    // Moderator Management
    // ========================================

    /// @notice Adds a moderator to the pool.
    function addModeratorToPool(address moderator, uint256 maxAmount) external;

    /// @notice Removes a moderator from the pool.
    function removeModeratorFromPool(address moderator) external;

    // ========================================
    // Donation and Fund Management
    // ========================================

    /// @notice Donates ETH to the pool and receives tokens/NFT.
    function donate() external payable returns (uint256 tokensReceived);

    /// @notice Transfers ether to a recipient.
    function transferEther(address payable recipient, uint256 amount) external payable;

    /// @notice Retrieves all donors and their total donated amounts.
    function getAllDonors() external view returns (address[] memory, uint256[] memory);

    /// @notice Retrieves the top 10 highest donors.
    function getTopDonors() external view returns (address[] memory, uint256[] memory);

    // AJ: a method getting all claims sent by users needed
    // input: N/A
    // output: a list of claims
    // PS. I'm not sure if I have access to this public variable claimRecords from frontend, so I added it here. Method added.
    // function getAllClaims() external view returns (ClaimRecord[] memory);
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

    function getDisasterEvent(string memory eventId) external view returns (string memory eventName, string memory eventDescription, uint256 disasterDate);
    function getAllDisasterEvents() external view returns (string[] memory eventIds);
}
