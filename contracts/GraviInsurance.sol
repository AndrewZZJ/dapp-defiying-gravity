// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
// import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GraviInsurance
 * @notice Implementation of disaster insurance policies and claims management
 * @dev Handles policy creation, claim processing, and fund management for disaster insurance
 */
contract GraviInsurance is IGraviInsurance, Ownable {
    using Strings for uint256;

    // ========================================
    // Structures and Enums
    // ========================================
    /**
     * @notice Insurance policy structure
     * @param policyId Unique identifier for the policy
     * @param policyHolder Address of the policy owner
     * @param maxCoverageAmount Maximum amount that can be claimed
     * @param premiumPaid Amount paid for the insurance
     * @param startTime When coverage begins
     * @param endTime When coverage ends
     * @param isClaimed Whether a claim has been processed for this policy
     * @param propertyAddress Physical address of the insured property
     * @param propertyValue Estimated value of the property
     */
    struct Policy {
        bytes32 policyId;
        address policyHolder;
        uint256 maxCoverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        uint256 endTime;
        bool isClaimed;
        string propertyAddress;
        uint256 propertyValue;
    }

    /**
     * @notice Enum for tracking claim status
     */
    enum ClaimStatus {
        Pending,
        Accepted,
        Denied
    }

    /**
     * @notice Structure for tracking moderator decisions on claims
     * @param moderator Information about the moderator
     * @param hasDecided Whether the moderator has made a decision
     * @param isApproved Whether the moderator approved the claim
     * @param approvedAmount Amount the moderator approved for payout
     */
    struct ModeratorInfo {
        Moderator moderator;
        bool hasDecided;
        bool isApproved;
        uint256 approvedAmount;
    }

    /**
     * @notice Structure for claim records
     * @param claimId Unique identifier for the claim
     * @param policyId Associated policy ID
     * @param eventId Associated disaster event ID
     * @param approvedClaimAmount Final approved payout amount
     * @param assessmentStart When claim assessment began
     * @param assessmentEnd When claim assessment ended
     * @param status Current status of the claim
     * @param incidentDescription Details about the incident
     * @param moderatorTeam Array of moderator decisions on this claim
     */
    struct ClaimRecord {
        uint256 claimId;
        bytes32 policyId;
        string eventId;
        uint256 approvedClaimAmount;
        uint256 assessmentStart;
        uint256 assessmentEnd;
        ClaimStatus status;
        string incidentDescription;
        ModeratorInfo[] moderatorTeam;
    }

    /**
     * @notice Structure for disaster events
     * @param eventId Unique identifier for the event (e.g., "EVT#1")
     * @param name Human-readable name of the event
     * @param disasterDate When the disaster occurred
     * @param eventDescription Details about the disaster event
     */
    struct DisasterEvent {
        string eventId;
        string name;
        uint256 disasterDate;
        string eventDescription;
    }

    /**
     * @notice Structure for tracking user-related data
     * @param policyIds Array of policy IDs owned by the user
     * @param claimIds Array of claim IDs filed by the user
     * @param donationTotal Total amount donated by the user
     */
    struct UserRecord {
        bytes32[] policyIds;
        uint256[] claimIds;
        uint256 donationTotal;
    }

    /**
     * @notice Structure for moderator data
     * @param moderatorAddress Address of the moderator
     * @param maxApprovalAmount Maximum amount this moderator can approve per claim
     * @param totalClaimsAssessed Total number of claims assessed
     * @param totalClaimsApproved Total number of claims approved
     * @param totalApprovedAmount Total amount approved across all claims
     */
    struct Moderator {
        address moderatorAddress;
        uint256 maxApprovalAmount;
        uint256 totalClaimsAssessed;
        uint256 totalClaimsApproved;
        uint256 totalApprovedAmount;
    }


    // ========================================
    // State Variables
    // ========================================
    string public disasterType;
    uint256 public premiumRate;
    uint256 public totalPoolFunds;

    IGraviCha public graviCha;
    // IGraviPoolNFT public graviPoolNFT;
    IGraviDisasterOracle public disasterOracle;

    // Storage for policies, keyed by policyId
    mapping(bytes32 => Policy) public policies;

    // Consolidated mapping of user records.
    mapping(address => UserRecord) public userRecords;

    // Storage for all donors, for iterating
    address[] public donors;


    // Mapping from moderator address to their information
    mapping(address => Moderator) public moderators;

    // Disaster events storage, keyed by string eventId.
    mapping(string => DisasterEvent) public disasterEvents;
    uint256 public nextEventId = 1;

    // Claims storage.
    ClaimRecord[] public claimRecords;
    uint256 public nextClaimId = 1;

    // Reward rate for donating ETH. (How many GraviCha to mint per ETH) all in wei.
    uint256 public donationRewardRate = 10000; // 1 ETH = 10000 GraviCha

    // ========================================
    // Events
    // ========================================
    event PolicyPurchased(
        address indexed user,
        bytes32 policyId,
        uint256 coverageAmount,
        uint256 premium,
        uint256 startTime,
        uint256 endTime
    );

    event FundsDonated(address indexed donor, uint256 amount);

    event DisasterEventAdded(string eventId);
    event DisasterEventModified(string eventId);
    event DisasterEventRemoved(string eventId);

    event ModeratorAdded(address moderator, uint256 maxAmount);
    event ModeratorRemoved(address moderator);

    event ClaimStarted(uint256 claimId, string incidentDescription);
    event ClaimAssessed(address moderator, uint256 claimId, bool isApproved, uint256 amount);
    event ClaimProcessed(uint256 claimId, ClaimStatus claimStatus, uint256 approvedClaimAmount);
    event ClaimApproved(address indexed user, bytes32 policyId, uint256 payout);


    // ========================================
    // Constructor
    // ========================================
    /**
     * @notice Initializes the insurance contract for a specific disaster type
     * @param _disasterType The type of disaster covered by this insurance
     * @param _premiumRate The rate used to calculate insurance premiums
     * @param _graviCha The address of the GraviCha token contract
     * @param _oracleAddress The address of the GraviOracle
     */
    constructor(
        string memory _disasterType,
        uint256 _premiumRate,
        address _graviCha,
        address _oracleAddress
        // address _graviPoolNFT
    )
        Ownable(msg.sender)
    {
        require(_premiumRate > 0, "Invalid premium rate");
        disasterType = _disasterType;
        premiumRate = _premiumRate;
        graviCha = IGraviCha(_graviCha);
        disasterOracle = IGraviDisasterOracle(_oracleAddress);
    }

    // ========================================
    // IGraviInsurance Interface Implementations
    // ========================================

    /**
     * @notice User buys an insurance policy using ETH
     * @param startTime The start time of the insurance policy
     * @param coveragePeriod Coverage period in days
     * @param propertyAddress The property address as a plain text string
     * @param propertyValue The value of the property (in ETH)
     * @return policyId The unique hash-based ID for the policy
     */
    function buyInsurance(
        uint256 startTime,      // Unix timestamp in seconds
        uint256 coveragePeriod, // Coverage period in days
        string memory propertyAddress,
        uint256 propertyValue
    ) external payable override returns (bytes32) {
        // Validate inputs
        require(startTime <= block.timestamp, "Start time must be <= current time");
        uint256 endTime = startTime + (coveragePeriod * 1 days);
        require(startTime < endTime, "Start time must be before end time");
        uint256 premium = calculatePremium(propertyAddress, propertyValue, coveragePeriod);
        require(premium > 0, "Premium must be greater than 0");
        require(msg.value == premium, "Incorrect ETH amount");

        // Create unique policyId using hash
        bytes32 policyId = keccak256(
            abi.encodePacked(address(this), msg.sender, block.timestamp)
        );

        uint256 coverageAmount = calculateCoverageAmountFromPremium(premium);

        // Save policy to storage
        Policy memory policy = Policy({
            policyId: policyId,
            policyHolder: msg.sender,
            maxCoverageAmount: coverageAmount,
            premiumPaid: premium,
            startTime: startTime,
            endTime: endTime,
            isClaimed: false,
            propertyAddress: propertyAddress,  // Store the property address
            propertyValue: propertyValue
        });

        policies[policyId] = policy;
        userRecords[msg.sender].policyIds.push(policyId);
        totalPoolFunds += premium;

        emit PolicyPurchased(msg.sender, policyId, propertyValue, premium, startTime, endTime);
        return policyId;
    }


    /**
     * @notice Calculates a mock insurance premium based on a property’s address, its value (in ETH), and a coverage period (in days).
     * @param propertyAddress The address of the property (as a string).
     * @param propertyValue The value of the property in ETH.
     * @param coveragePeriod The coverage period in days.
     * @return premium The calculated premium amount in ETH.
     */
    function calculatePremium(
        string memory propertyAddress,
        uint256 propertyValue,  // in ETH
        uint256 coveragePeriod  // in days
    ) public pure override returns (uint256 premium) {
        // Generate a pseudo-random factor based on the property address.
        // This results in a number between 1 and 100.
        uint256 addressFactor = (uint256(keccak256(abi.encodePacked(propertyAddress))) % 100) + 1;
        
        // Use a simple formula:
        // premium = (propertyValue * coveragePeriod * addressFactor) / divisor
        // The divisor is chosen to adjust the scale of the premium.
        uint256 divisor = 4000000; // Example divisor;
        
        premium = (propertyValue * coveragePeriod * addressFactor) / divisor;
    }

    /**
     * @notice Calculates coverage amount based on the premium paid
     * @param premium The premium paid (in ETH)
     * @return coverageAmount The resulting coverage amount (in ETH)
     */
    function calculateCoverageAmountFromPremium(uint256 premium) public pure returns (uint256 coverageAmount) {
        // Define a fixed ratio. For example, if the ratio is 5, then coverage = 5 * premium.
        uint256 ratio = 5;
        coverageAmount = premium * ratio;
    }

    /**
     * @notice Gets the donation reward rate
     * @return The donation exchange rate
     */
    function getDonationRewardRate() external view returns (uint256) {
        return donationRewardRate;
    }

    /**
     * @notice Sets the donation reward rate (1 ETH to X GraviCha)
     * @param newRate The new reward rate
     * @dev Only callable by the owner
     */
    function setDonationRewardRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Invalid rate");
        donationRewardRate = newRate;
    }

    /**
     * @notice Donate ETH to the pool and receive charity tokens
     * @return tokensReceived The amount of charity tokens minted for this donation
     */
    function donate() external payable returns (uint256 tokensReceived) {
        require(msg.value > 0, "Must send ETH");
        totalPoolFunds += msg.value;

        // If this is the user's first donation, record them as a donor.
        if (userRecords[msg.sender].donationTotal == 0) {
            donors.push(msg.sender);
        }
        userRecords[msg.sender].donationTotal += msg.value;

        graviCha.mint(msg.sender, msg.value * donationRewardRate);
        emit FundsDonated(msg.sender, msg.value);
        return msg.value * donationRewardRate;
    }

    // Allow receiving ETH directly.
    receive() external payable {
        totalPoolFunds += msg.value;
    }

    /**
     * @notice Adds a new disaster event
     * @param eventName The name of the disaster event
     * @param eventDescription Description of the disaster event
     * @param disasterDate Date when the disaster occurred
     * @dev Only callable by the owner
     */
    function addDisasterEvent(
        string memory eventName,
        string memory eventDescription,
        uint256 disasterDate
    ) external override onlyOwner {
        // Generate a unique eventId as a string, e.g., "EVT#1"
        string memory autoEventId = string(abi.encodePacked("EVT#", nextEventId.toString()));
        nextEventId++;
        disasterEvents[autoEventId] = DisasterEvent({
            eventId: autoEventId,
            name: eventName,
            disasterDate: disasterDate,
            eventDescription: eventDescription
        });
        emit DisasterEventAdded(autoEventId);
    }

    /**
     * @notice Returns the details of a disaster event
     * @param eventId The ID of the disaster event
     * @return eventName The name of the disaster event
     * @return eventDescription The description of the disaster event
     * @return disasterDate The date of the disaster event
     */
    function getDisasterEvent(string memory eventId) external view returns (string memory eventName, string memory eventDescription, uint256 disasterDate) {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        DisasterEvent storage de = disasterEvents[eventId];
        return (de.name, de.eventDescription, de.disasterDate);
    }

    /**
     * @notice Returns a list of all disaster events by their IDs
     * @return eventIds An array of disaster event IDs
     */
    function getAllDisasterEvents() external view returns (string[] memory eventIds) {
        uint256 count = nextEventId - 1; // Adjust for 0-based index
        eventIds = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            eventIds[i] = string(abi.encodePacked("EVT#", (i + 1).toString()));
        }
    }

    /**
     * @notice Modifies an existing disaster event
     * @param eventId The unique identifier of the event to modify
     * @param newName The new name for the event
     * @param newEventDescription The new description for the event
     * @param disasterDate The new date for the disaster
     * @dev Only callable by the owner
     */
    function modifyDisasterEvent(
        string memory eventId,
        string calldata newName,
        string calldata newEventDescription,
        uint256 disasterDate
    ) external override onlyOwner {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        DisasterEvent storage de = disasterEvents[eventId];
        de.name = newName;
        de.eventDescription = newEventDescription;
        de.disasterDate = disasterDate;
        emit DisasterEventModified(eventId);
    }


    /**
     * @notice Removes an existing disaster event
     * @param eventId The unique identifier of the event to remove
     * @dev Only callable by the owner
     */
    function removeDisasterEvent(
        string memory eventId
    ) external override onlyOwner {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        delete disasterEvents[eventId];
        emit DisasterEventRemoved(eventId);
    }


    /**
     * @notice Adds a new moderator to the pool
     * @param _moderatorAddress The address of the moderator to be added
     * @param maxAmount The maximum claim amount the moderator can approve
     * @dev Only callable by the owner
     */
    function addModeratorToPool(address _moderatorAddress, uint256 maxAmount) external override onlyOwner {
        require(_moderatorAddress != address(0), "Invalid moderator address");
        require(maxAmount > 0, "Max approval amount must be greater than zero");
        require(moderators[_moderatorAddress].maxApprovalAmount == 0, "Moderator already exists");

        // Add moderator to the pool
        moderators[_moderatorAddress] = Moderator({
            moderatorAddress: _moderatorAddress,
            maxApprovalAmount: maxAmount,
            totalClaimsAssessed: 0,
            totalClaimsApproved: 0,
            totalApprovedAmount: 0
        });

        emit ModeratorAdded(_moderatorAddress, maxAmount);
    }

    /**
     * @notice Removes a moderator from the pool
     * @param moderator The address of the moderator to be removed
     * @dev Only callable by the owner
     */
    function removeModeratorFromPool(address moderator) external override onlyOwner {
        require(moderator != address(0), "Invalid moderator address");
        require(moderators[moderator].maxApprovalAmount != 0, "Moderator does not exist");

        // Delete the moderator from the mapping
        delete moderators[moderator];

        emit ModeratorRemoved(moderator);
    }

    /**
     * @notice Transfers Ether to a specified recipient
     * @param recipient The address to receive the Ether
     * @param amount The amount of Ether to transfer
     * @dev Only callable by the owner
     */
    function transferEther(
        address payable recipient,
        uint256 amount
    ) external payable override onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Transfer failed");
    }


    /**
     * @notice Starts a new claim for the given policy and event
     * @param eventId The ID of the disaster event
     * @param policyId The ID of the insurance policy
     * @param incidentDescription A description of the incident
     * @return True if the claim was successfully started
     */
    function startAClaim(
        string memory eventId,
        bytes32 policyId,
        string memory incidentDescription
    ) external override returns (bool) {
        // Check if the disaster event exists
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");

        // Ensure the caller owns the policy
        require(policies[policyId].policyHolder == msg.sender, "Not the policy holder");

        // Ensure the policy exists and is not already claimed
        Policy memory policy = policies[policyId];
        require(!policy.isClaimed, "Policy already claimed");

        // Check that the policy is active
        require(block.timestamp >= policy.startTime, "Policy not yet active");
        require(block.timestamp <= policy.endTime, "Policy has expired");

        uint256 assessmentStart = block.timestamp;
        uint256 assessmentEnd = block.timestamp + 3 days;

        // Generate a new claim ID
        uint256 claimId = nextClaimId;
        nextClaimId++;

        // Create a new claim record
        ClaimRecord memory newClaim = ClaimRecord({
            claimId: claimId,
            policyId: policyId,
            eventId: eventId,
            approvedClaimAmount: 0,    // Default to 0, to be updated after assessment
            assessmentStart: assessmentStart,
            assessmentEnd: assessmentEnd,
            status: ClaimStatus.Pending,
            incidentDescription: incidentDescription,
            moderatorTeam: new ModeratorInfo[](0)  // Initialize empty array
        });

        // Store the new claim record
        claimRecords.push(newClaim);

        // Record the claim in the user's record
        userRecords[msg.sender].claimIds.push(claimId);

        emit ClaimStarted(claimId, incidentDescription);
        return true;
    }


    /**
     * @notice Processes the claim to determine the final decision based on moderator votes
     * @param claimId The ID of the claim to process
     */
    function processClaim(uint256 claimId) external override {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

        // Access the claim record from the array
        ClaimRecord storage claim = claimRecords[claimId - 1];
        require(claim.status == ClaimStatus.Pending, "Claim already finalized");

        uint256 totalModerators = claim.moderatorTeam.length;
        require(totalModerators >= 3, "Not enough moderators have assessed this claim");

        // Use mocked Oracle for disaster event verification
        require(disasterOracle.validateClaim(disasterType), "Disaster event not valid");

        uint256 approvals = 0;
        uint256 totalApprovedAmount = 0;

        // Calculate the majority threshold
        uint256 majority = (totalModerators / 2) + 1;

        // Count approvals from moderators
        for (uint256 i = 0; i < totalModerators; i++) {
            ModeratorInfo memory decision = claim.moderatorTeam[i];
            if (decision.hasDecided && decision.isApproved) {
                approvals++;
                totalApprovedAmount += decision.approvedAmount;
            }
        }

        uint256 averageApprovedAmount = 0;
        if (approvals > 0) {
            // Calculate the average approved amount
            averageApprovedAmount = totalApprovedAmount / approvals;
        }

        // Determine the final claim status based on the majority vote
        if (approvals >= majority) {
            claim.status = ClaimStatus.Accepted;
            claim.approvedClaimAmount = averageApprovedAmount;

            // Update moderator statistics only if the claim is approved
            for (uint256 i = 0; i < totalModerators; i++) {
                ModeratorInfo memory decision = claim.moderatorTeam[i];
                if (decision.isApproved) {
                    moderators[decision.moderator.moderatorAddress].totalClaimsApproved++;
                    moderators[decision.moderator.moderatorAddress].totalApprovedAmount += decision.approvedAmount;
                }
                moderators[decision.moderator.moderatorAddress].totalClaimsAssessed++;
            }

            emit ClaimProcessed(claimId, ClaimStatus.Accepted, averageApprovedAmount);
        } else {
            claim.status = ClaimStatus.Denied;
            claim.approvedClaimAmount = 0;
            emit ClaimProcessed(claimId, ClaimStatus.Denied, 0);
        }

        // Mark the claim as processed
        claim.assessmentEnd = block.timestamp;
    }



    /**
     * @notice Allows a moderator to assess a claim by approving or denying it
     * @param claimId The ID of the claim being assessed
     * @param isApproved Whether the claim is approved
     * @param amount The amount the moderator approves
     */
    function assessClaim(uint256 claimId, bool isApproved, uint256 amount) external override {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

        // Access the claim record from the array
        ClaimRecord storage claim = claimRecords[claimId - 1];
        require(claim.status == ClaimStatus.Pending, "Claim already processed");

        // Check if the caller is a registered moderator
        require(moderators[msg.sender].maxApprovalAmount > 0, "Not a registered moderator");

        // Validate the approval amount if approved
        if (isApproved) {
            require(amount > 0, "Approval amount must be greater than zero");
            require(amount <= moderators[msg.sender].maxApprovalAmount, "Amount exceeds moderator cap");
        } else {
            amount = 0;  // Set to zero if denied
        }

        // Check if the moderator has already assessed this claim
        for (uint256 i = 0; i < claim.moderatorTeam.length; i++) {
            require(claim.moderatorTeam[i].moderator.moderatorAddress != msg.sender, "Already assessed");
        }

        // Add the moderator's decision to the claim record
        claim.moderatorTeam.push(ModeratorInfo({
            moderator: moderators[msg.sender],
            hasDecided: true,
            isApproved: isApproved,
            approvedAmount: amount
        }));

        emit ClaimAssessed(msg.sender, claimId, isApproved, amount);
    }




    /**
     * @notice Executes payout for a processed claim
     * @param claimId The ID of the claim to process for payout
     * @dev Only callable by the owner
     */
    function payoutClaim(uint256 claimId) external override onlyOwner {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

        // Access the claim record from the array
        ClaimRecord storage claim = claimRecords[claimId - 1];
        require(claim.status == ClaimStatus.Accepted, "Claim not accepted");
        
        // Access the associated policy using the policy ID
        Policy storage policy = policies[claim.policyId];
        require(!policy.isClaimed, "Policy already claimed");
        
        // Check if the approved claim amount is greater than zero
        uint256 payoutAmount = claim.approvedClaimAmount;
        require(payoutAmount > 0, "No approved claim amount");
        require(totalPoolFunds >= payoutAmount, "Insufficient funds in the pool");

        // Mark the policy as claimed and update the pool funds
        policy.isClaimed = true;
        totalPoolFunds -= payoutAmount;

        // Transfer the payout to the policy holder
        (bool sent, ) = policy.policyHolder.call{value: payoutAmount}("");
        require(sent, "ETH transfer failed");

        // Update claim status to mark it as paid
        claim.status = ClaimStatus.Accepted;

        emit ClaimApproved(
            policy.policyHolder,
            policy.policyId,
            payoutAmount
        );
    }



    // ========================================
    // Internal Helper Functions
    // ========================================
    /**
     * @dev Converts a ClaimStatus enum to its string representation
     * @param status The status enum value
     * @return The string representation of the status
     */
    function getStatusString(
        ClaimStatus status
    ) internal pure returns (string memory) {
        if (status == ClaimStatus.Pending) return "Pending";
        if (status == ClaimStatus.Accepted) return "Accepted";
        if (status == ClaimStatus.Denied) return "Denied";
        return "";
    }

    // ========================================
    // View Functions
    // ========================================

    /**
     * @notice Returns the policy IDs for a given user
     * @param user The address of the user
     * @return Array of policy identifiers
     */
    function fetchInsuranceIds(
        address user
    ) external view override returns (bytes32[] memory) {
        return userRecords[user].policyIds;
    }
    
    /**
     * @notice Returns all insurance policies held by the caller.
     * @return policyIds Array of policy IDs.
     * @return policyHolders Array of policy holder addresses.
     * @return maxCoverageAmounts Array of maximum coverage amounts for each policy.
     * @return premiums Array of premiums paid for each policy.
     * @return startTimes Array of start times for each policy.
     * @return endTimes Array of end times for each policy.
     * @return isClaimedList Array indicating whether each policy has been claimed.
     * @return propertyAddresses Array of property addresses associated with each policy.
     * @return propertyValues Array of property values associated with each policy.
     */
    function getUserPolicies() external view override returns (
        bytes32[] memory policyIds,
        address[] memory policyHolders,
        uint256[] memory maxCoverageAmounts,
        uint256[] memory premiums,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bool[] memory isClaimedList,
        string[] memory propertyAddresses,
        uint256[] memory propertyValues
    ) {
        uint256 count = userRecords[msg.sender].policyIds.length;

        policyIds = new bytes32[](count);
        policyHolders = new address[](count);
        maxCoverageAmounts = new uint256[](count);
        premiums = new uint256[](count);
        startTimes = new uint256[](count);
        endTimes = new uint256[](count);
        isClaimedList = new bool[](count);
        propertyAddresses = new string[](count);
        propertyValues = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            bytes32 pid = userRecords[msg.sender].policyIds[i];
            Policy memory p = policies[pid];

            policyIds[i] = p.policyId;
            policyHolders[i] = p.policyHolder;
            maxCoverageAmounts[i] = p.maxCoverageAmount;
            premiums[i] = p.premiumPaid;
            startTimes[i] = p.startTime;
            endTimes[i] = p.endTime;
            isClaimedList[i] = p.isClaimed;
            propertyAddresses[i] = p.propertyAddress;
            propertyValues[i] = p.propertyValue;
        }
    }

    /**
     * @notice Gets details of a specific policy
     * @dev This function retrieves the details of a policy associated with the given policy ID.
     *      It ensures that only the policy holder can access the policy details.
     * @param policyId The identifier of the policy
     * @return _policyId The unique identifier of the policy
     * @return _policyHolder The address of the policy holder
     * @return _maxCoverageAmount The maximum coverage amount of the policy
     * @return _premiumPaid The premium amount paid for the policy
     * @return _startTime The start time of the policy
     * @return _endTime The end time of the policy
     * @return _isClaimed The claim status of the policy (true if claimed, false otherwise)
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
    ) {
        Policy memory p = policies[policyId];
        require(p.policyHolder == msg.sender, "Caller is not policy holder");
        return (
            p.policyId,
            p.policyHolder,
            p.maxCoverageAmount,
            p.premiumPaid,
            p.startTime,
            p.endTime,
            p.isClaimed,
            p.propertyAddress,
            p.propertyValue
        );
    }


    /**
     * @notice Returns the addresses of all moderators assigned to a specific claim
     * @param claimId The ID of the claim to retrieve moderators for
     * @return moderatorAddresses An array of moderator addresses
     */
    function getClaimModerators(uint256 claimId) external view override returns (address[] memory) {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

        // Access the claim record from the array
        ClaimRecord storage claim = claimRecords[claimId - 1];

        // Get the number of moderators in the team
        uint256 numModerators = claim.moderatorTeam.length;
        address[] memory moderatorAddresses = new address[](numModerators);

        // Iterate through the moderator team and extract their addresses
        for (uint256 i = 0; i < numModerators; i++) {
            moderatorAddresses[i] = claim.moderatorTeam[i].moderator.moderatorAddress;
        }

        return moderatorAddresses;
    }

    /**
     * @notice Returns the claim IDs for a given user
     * @param user The address of the user to fetch claims for
     * @return claimIds An array of claim IDs
     */
    function fetchClaimIds(address user) external view returns (uint256[] memory) {
        return userRecords[user].claimIds;
    }

    /**
     * @notice Returns the details of a specific claim
     * @param claimId The ID of the claim to retrieve
     * @return _claimId The ID of the claim
     * @return _policyId The ID of the associated policy
     * @return _eventId The ID of the event related to the claim
     * @return _approvedClaimAmount The approved claim amount
     * @return _assessmentStart The timestamp when the assessment started
     * @return _assessmentEnd The timestamp when the assessment ended
     * @return _status The status of the claim as a string
     * @return _incidentDescription A description of the incident
     * @return moderatorAddresses An array of moderator addresses involved in the claim
     * @return hasDecidedList An array indicating whether each moderator has made a decision
     * @return isApprovedList An array indicating whether each moderator approved the claim
     * @return approvedAmounts An array of approved amounts by each moderator
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
    ) {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");
        ClaimRecord storage claim = claimRecords[claimId - 1];

        uint256 moderatorCount = claim.moderatorTeam.length;
        moderatorAddresses = new address[](moderatorCount);
        hasDecidedList = new bool[](moderatorCount);
        isApprovedList = new bool[](moderatorCount);
        approvedAmounts = new uint256[](moderatorCount);

        for (uint256 i = 0; i < moderatorCount; i++) {
            ModeratorInfo memory modInfo = claim.moderatorTeam[i];
            moderatorAddresses[i] = modInfo.moderator.moderatorAddress;
            hasDecidedList[i] = modInfo.hasDecided;
            isApprovedList[i] = modInfo.isApproved;
            approvedAmounts[i] = modInfo.approvedAmount;
        }

        return (
            claim.claimId,
            claim.policyId,
            claim.eventId,
            claim.approvedClaimAmount,
            claim.assessmentStart,
            claim.assessmentEnd,
            getStatusString(claim.status),
            claim.incidentDescription,
            moderatorAddresses,
            hasDecidedList,
            isApprovedList,
            approvedAmounts
        );
    }

    /**
     * @notice Returns the claims associated with the caller.
     * @return claimIds An array of claim IDs associated with the user.
     * @return policyIds An array of policy IDs corresponding to the claims.
     * @return moderatorList A 2D array where each sub-array contains the addresses of moderators for a claim.
     * @return statuses An array of statuses for each claim, represented as strings.
     * @return descriptions An array of descriptions for each claim's incident.
     */
    function getUserClaims() 
        external 
        view override
        returns (
            uint256[] memory claimIds,
            bytes32[] memory policyIds,
            address[][] memory moderatorList,
            string[] memory statuses,
            string[] memory descriptions
        ) 
    {
        uint256 claimCount = userRecords[msg.sender].claimIds.length;
        require(claimCount > 0, "User has no claims");

        // Initialize arrays to store the results
        claimIds = new uint256[](claimCount);
        policyIds = new bytes32[](claimCount);
        moderatorList = new address[][](claimCount);
        statuses = new string[](claimCount);
        descriptions = new string[](claimCount);

        for (uint256 i = 0; i < claimCount; i++) {
            uint256 claimId = userRecords[msg.sender].claimIds[i];
            require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

            ClaimRecord storage claim = claimRecords[claimId - 1];
            
            // Populate claim data
            claimIds[i] = claim.claimId;
            policyIds[i] = claim.policyId;
            descriptions[i] = claim.incidentDescription;
            statuses[i] = getStatusString(claim.status);

            // Check for valid moderator data
            uint256 numModerators = claim.moderatorTeam.length;
            address[] memory moderatorAddresses = new address[](numModerators);
            for (uint256 j = 0; j < numModerators; j++) {
                address modAddr = claim.moderatorTeam[j].moderator.moderatorAddress;
                require(modAddr != address(0), "Invalid moderator address");
                moderatorAddresses[j] = modAddr;
            }
            moderatorList[i] = moderatorAddresses;
        }

        return (claimIds, policyIds, moderatorList, statuses, descriptions);
    }


    /**
     * @notice Returns all donors and their total donated amounts
     * @return Arrays of donor addresses and corresponding donation amounts
     */
    function getAllDonors()
        external
        view override
        returns (address[] memory, uint256[] memory)
    {
        uint256 len = donors.length;
        address[] memory addrs = new address[](len);
        uint256[] memory amounts = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            addrs[i] = donors[i];
            amounts[i] = userRecords[donors[i]].donationTotal;
        }
        return (addrs, amounts);
    }

    /**
     * @notice Returns the top 10 highest donors based on total donation amount
     * @return topDonors An array of the top 10 donor addresses
     * @return topAmounts An array of the corresponding donation amounts
     */
    function getTopDonors() external view override returns (address[] memory topDonors, uint256[] memory topAmounts) {
        uint256 donorCount = donors.length;
        uint256 topCount = donorCount < 10 ? donorCount : 10;

        // Initialize arrays for the top donors and amounts
        topDonors = new address[](topCount);
        topAmounts = new uint256[](topCount);

        // Temporary arrays to store donors and amounts for sorting
        address[] memory donorArray = new address[](donorCount);
        uint256[] memory amountArray = new uint256[](donorCount);

        // Populate the temporary arrays with donors and their donation amounts
        for (uint256 i = 0; i < donorCount; i++) {
            donorArray[i] = donors[i];
            amountArray[i] = userRecords[donors[i]].donationTotal;
        }

        // Sort the donors by donation amount in descending order (Bubble Sort for simplicity)
        for (uint256 i = 0; i < donorCount; i++) {
            for (uint256 j = i + 1; j < donorCount; j++) {
                if (amountArray[i] < amountArray[j]) {
                    // Swap amounts
                    (amountArray[i], amountArray[j]) = (amountArray[j], amountArray[i]);
                    // Swap addresses
                    (donorArray[i], donorArray[j]) = (donorArray[j], donorArray[i]);
                }
            }
        }

        // Store the top 10 donors after sorting
        for (uint256 k = 0; k < topCount; k++) {
            topDonors[k] = donorArray[k];
            topAmounts[k] = amountArray[k];
        }
    }

    /**
     * @notice Returns all claim records
     * @return Array of all claim records
     */
    function getAllClaims() external view returns (ClaimRecord[] memory) {
        return claimRecords;
    }

}
