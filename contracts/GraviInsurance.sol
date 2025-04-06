// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
// import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
//import {IGraviDisasterOracle} from "./interfaces/IGraviDisasterOracle.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract GraviInsurance is IGraviInsurance, Ownable {
    using Strings for uint256;

    // ========================================
    // Structures and Enums
    // ========================================
    // Policy created when a user buys insurance.
    struct Policy {
        bytes32 policyId;
        address policyHolder;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        uint256 endTime;          // End time of the insurance policy
        bool isClaimed;
        bytes32 propertyAddress;  // Hashed property address
        uint256 propertyValue;    // Value of the property (in ETH)
    }


    // Enum for claim statuses.
    enum ClaimStatus {
        Pending,
        Accepted,
        Denied
    }

    // Claim record structure, associated with both a policy and a disaster event.
    struct ClaimRecord {
        uint256 claimId; // Auto-incremented claim ID.
        bytes32 policyId; // Associated policy.
        string eventId; // Associated disaster event (string ID, e.g., "EVT#1").
        uint256 claimAmount; // Automatically set to the active policy's coverage amount.
        uint256 assessmentStart; // Timestamp when claim assessment starts.
        uint256 assessmentEnd; // Timestamp when claim assessment ends.
        ClaimStatus status; // Current claim status.
        string incidentDescription; // Details about the incident.
    }

    // Disaster event structure.
    struct DisasterEvent {
        string eventId; // Auto-generated unique id as a string, e.g., "EVT#1".
        string name; // Human-readable event name.
        uint256 disasterDate;
        string eventDescription;
        address[] claimModerators;
    }

    // Consolidated user record that stores all data related to a user.
    struct UserRecord {
        bytes32[] policyIds;
        uint256[] claimIds;
        uint256 donationTotal;
    }

    // ========================================
    // State Variables
    // ========================================
    string public disasterType;
    uint256 public premiumRate;
    uint256 public totalPoolFunds;

    IGraviCha public graviCha;
    // IGraviPoolNFT public graviPoolNFT;
    //IGraviDisasterOracle public disasterOracle;

    // Storage for policies, keyed by policyId
    mapping(bytes32 => Policy) public policies;

    // Consolidated mapping of user records.
    mapping(address => UserRecord) public userRecords;

    // Storage for all donors, for iterating
    address[] public donors;

    // Disaster events storage, keyed by string eventId.
    mapping(string => DisasterEvent) public disasterEvents;
    uint256 public nextEventId = 1;

    // Claims storage.
    ClaimRecord[] public claimRecords;
    uint256 public nextClaimId = 1;

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
    event ClaimStarted(uint256 claimId, string incidentDescription);
    event ClaimProcessed(uint256 claimId, ClaimStatus status);
    event ClaimApproved(address indexed user, bytes32 policyId, uint256 payout);
    event FundsDonated(address indexed donor, uint256 amount);
    event DisasterEventAdded(string eventId);
    event DisasterEventModified(string eventId);
    event DisasterEventRemoved(string eventId);
    event ClaimModeratorAdded(string eventId, address moderator);
    event ClaimModeratorRemoved(string eventId, address moderator);

    // ========================================
    // Constructor
    // ========================================
    constructor(
        string memory _disasterType,
        uint256 _premiumRate,
        address _graviCha
    )
        // address _graviPoolNFT
        //address _oracleAddress
        Ownable(msg.sender)
    {
        require(_premiumRate > 0, "Invalid premium rate");
        disasterType = _disasterType;
        premiumRate = _premiumRate;
        graviCha = IGraviCha(_graviCha);
        // graviPoolNFT = IGraviPoolNFT(_graviPoolNFT);
        //disasterOracle = IGraviDisasterOracle(_oracleAddress);
    }

    // ========================================
    // IGraviInsurance Interface Implementations
    // ========================================

    /// @notice User buys an insurance policy using ETH
    /// @param startTime The start time of the insurance policy (must be <= current time)
    /// @param propertyAddress The property address as a plain text string
    /// @param propertyValue The value of the property (in ETH)
    /// @return policyId The unique hash-based ID for the policy
    function buyInsurance(
        uint256 startTime,      // Unix timestamp in seconds
        uint256 coveragePeriod, // Coverage period in days
        string memory propertyAddress,
        uint256 propertyValue
    ) external payable returns (bytes32) {
        // Validate inputs
        require(startTime <= block.timestamp, "Start time must be <= current time");
        uint256 endTime = startTime + (coveragePeriod * 1 days);
        require(startTime < endTime, "Start time must be before end time");
        uint256 premium = calculatePremium(propertyAddress, propertyValue, coveragePeriod);
        require(premium > 0, "Premium must be greater than 0");
        require(msg.value == premium, "Incorrect ETH amount");
        
        // Hash the property address for secure storage
        bytes32 hashedAddress = keccak256(abi.encodePacked(propertyAddress));

        // Create unique policyId using hash
        bytes32 policyId = keccak256(
            abi.encodePacked(address(this), msg.sender, block.timestamp)
        );

        uint256 coverageAmount = calculateCoverageAmountFromPremium(premium);

        // Save policy to storage
        Policy memory policy = Policy({
            policyId: policyId,
            policyHolder: msg.sender,
            coverageAmount: coverageAmount, // calculate using mocked function
            premiumPaid: premium,
            startTime: startTime,
            endTime: endTime,
            isClaimed: false,
            propertyAddress: hashedAddress,  // Store the hashed property address
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
        uint256 divisor = 10000; // Example divisor;
        
        premium = (propertyValue * coveragePeriod * addressFactor) / divisor;
    }

    /// @notice Calculates a mocked coverage amount based solely on the premium and a fixed ratio.
    /// @param premium The premium paid (in ETH).
    /// @return coverageAmount The resulting coverage amount (in ETH).
    function calculateCoverageAmountFromPremium(uint256 premium) public pure returns (uint256 coverageAmount) {
        // Define a fixed ratio. For example, if the ratio is 2, then coverage = 2 * premium.
        uint256 ratio = 2;
        coverageAmount = premium * ratio;
    }

    /// @notice Donate ETH to the pool and receive tokens/NFT.
    function donate() external payable {
        require(msg.value > 0, "Must send ETH");
        totalPoolFunds += msg.value;

        // If this is the user's first donation, record them as a donor.
        if (userRecords[msg.sender].donationTotal == 0) {
            donors.push(msg.sender);
        }
        userRecords[msg.sender].donationTotal += msg.value;

        graviCha.mint(msg.sender, msg.value);
        emit FundsDonated(msg.sender, msg.value);
    }

    // Allow receiving ETH directly.
    receive() external payable {
        totalPoolFunds += msg.value;
    }

    /// @notice Adds a new disaster event.
    /// A unique eventId is auto-generated (e.g., "EVT#1") and stored along with the event name, description, and initial claim moderators.
    function addDisasterEvent(
        string memory eventName,
        string memory eventDescription,
        uint256 disasterDate,
        address[] calldata initialModerators
    ) external onlyOwner {
        // Generate a unique eventId as a string, e.g., "EVT#1"
        string memory autoEventId = string(abi.encodePacked("EVT#", nextEventId.toString()));
        nextEventId++;
        disasterEvents[autoEventId] = DisasterEvent({
            eventId: autoEventId,
            name: eventName,
            disasterDate: disasterDate,
            eventDescription: eventDescription,
            claimModerators: initialModerators
        });
        emit DisasterEventAdded(autoEventId);
    }


    /// @notice Modifies an existing disaster event.
    /// Updates the event name and event description.
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


    /// @notice Removes an existing disaster event.
    function removeDisasterEvent(
        string memory eventId
    ) external override onlyOwner {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        delete disasterEvents[eventId];
        emit DisasterEventRemoved(eventId);
    }


    /// @notice Adds a claim moderator to the specified disaster event.
    function addClaimModerator(
        string memory eventId,
        address moderator
    ) external override onlyOwner {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        DisasterEvent storage de = disasterEvents[eventId];
        // Ensure the moderator isn't already added.
        for (uint256 i = 0; i < de.claimModerators.length; i++) {
            require(de.claimModerators[i] != moderator, "Moderator already exists");
        }
        de.claimModerators.push(moderator);
        emit ClaimModeratorAdded(eventId, moderator);
    }

    /// @notice Removes a claim moderator from the specified disaster event.
    function removeClaimModerator(
        string memory eventId,
        address moderator
    ) external override onlyOwner {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        DisasterEvent storage de = disasterEvents[eventId];
        bool found = false;
        uint256 indexToRemove;
        for (uint256 i = 0; i < de.claimModerators.length; i++) {
            if (de.claimModerators[i] == moderator) {
                found = true;
                indexToRemove = i;
                break;
            }
        }
        require(found, "Moderator not found");
        // Remove the moderator by replacing it with the last element and then popping.
        de.claimModerators[indexToRemove] = de.claimModerators[de.claimModerators.length - 1];
        de.claimModerators.pop();
        emit ClaimModeratorRemoved(eventId, moderator);
    }


    function transferEther(
        address payable recipient,
        uint256 amount
    ) external payable override onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Transfer failed");
    }



    /// @notice Starts a claim. The claim amount is set to the active policy's coverage amount.
    function startAClaim(
        string memory eventId,
        string memory incidentDescription
    ) external override returns (bool) {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        // Ensure the caller has an active, unclaimed policy.
        bytes32[] memory userPolicies = userRecords[msg.sender].policyIds;
        require(userPolicies.length > 0, "No policy found");
        bytes32 activePolicy;
        bool found = false;
        for (uint256 i = 0; i < userPolicies.length; i++) {
            if (!policies[userPolicies[i]].isClaimed) {
                activePolicy = userPolicies[i];
                found = true;
                break;
            }
        }
        require(found, "No active policy found");

        Policy memory policy = policies[activePolicy];
        uint256 assessmentStart = block.timestamp;
        uint256 assessmentEnd = block.timestamp + 3 days; //Todo: update assessmentEnd time WHEN

        ClaimRecord memory newClaim = ClaimRecord({
            claimId: nextClaimId,
            policyId: activePolicy,
            eventId: eventId, // Associate the claim with the specified event.
            claimAmount: policy.coverageAmount,
            assessmentStart: assessmentStart,
            assessmentEnd: assessmentEnd,
            status: ClaimStatus.Pending,
            incidentDescription: incidentDescription
        });
        claimRecords.push(newClaim);
        // Record the claim in the user's record.
        userRecords[msg.sender].claimIds.push(nextClaimId);
        emit ClaimStarted(nextClaimId, incidentDescription);
        nextClaimId++;
        return true;
    }

    /// @notice Processes a claim by its claim ID.
    /// Verifies that the caller is the owner of the associated policy and updates the claim status.
    function processClaim(uint256 _claimId) external {
        require(_claimId > 0 && _claimId < nextClaimId, "Invalid claim id");
        ClaimRecord storage claim = claimRecords[_claimId - 1];
        Policy storage policy = policies[claim.policyId];
        require(policy.policyHolder == msg.sender, "Not your policy");
        require(claim.status == ClaimStatus.Pending, "Claim already processed");

        // Todo: Call the oracle to validate the claim.
        // bool valid = disasterOracle.validateClaim(claim.incidentDescription, disasterType, claim.evidence);
        // require(valid, "Oracle validation failed");

        // Todo: DAO approval

        // Update claim status to Accepted.
        claim.status = ClaimStatus.Accepted;
        emit ClaimProcessed(_claimId, ClaimStatus.Accepted);
    }

    /// @notice Executes payout for a processed claim.
    /// Only the contract owner can call this function.
    function payoutClaim(uint256 _claimId) external onlyOwner {
        require(_claimId > 0 && _claimId < nextClaimId, "Invalid claim id");
        ClaimRecord storage claim = claimRecords[_claimId - 1];
        require(claim.status == ClaimStatus.Accepted, "Claim not accepted");
        Policy storage policy = policies[claim.policyId];
        require(!policy.isClaimed, "Policy already claimed");
        require(totalPoolFunds >= policy.coverageAmount, "Insufficient funds");

        // Mark the policy as claimed and update funds.
        policy.isClaimed = true;
        totalPoolFunds -= policy.coverageAmount;

        (bool sent, ) = policy.policyHolder.call{value: policy.coverageAmount}(
            ""
        );
        require(sent, "ETH transfer failed");

        emit ClaimApproved(
            policy.policyHolder,
            policy.policyId,
            policy.coverageAmount
        );
    }

    // ========================================
    // View Functions
    // ========================================

    /// @notice Returns the insurance (policy) details for the user.
    /// @return user The caller's address.
    /// @return policyIds An array of policy IDs held by the user.
    /// @return hashedPropertyAddresses An array of the hashed property addresses.
    /// @return coverageAmounts An array of coverage amounts (in ETH).
    /// @return coverageEndDates An array of the policy end times (as Unix timestamps).
    /// @return insuranceTypes An array of insurance types (e.g., "fire", "flood", "earthquake").
    function getUserPolicies() external view override returns (
        address user,
        bytes32[] memory policyIds,
        bytes32[] memory hashedPropertyAddresses,
        uint256[] memory coverageAmounts,
        uint256[] memory coverageEndDates,
        string[] memory insuranceTypes
    ) {
        user = msg.sender;
        uint256 count = userRecords[msg.sender].policyIds.length;
        policyIds = new bytes32[](count);
        hashedPropertyAddresses = new bytes32[](count);
        coverageAmounts = new uint256[](count);
        coverageEndDates = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            bytes32 pid = userRecords[msg.sender].policyIds[i];
            Policy memory policy = policies[pid];
            policyIds[i] = pid;
            hashedPropertyAddresses[i] = policy.propertyAddress;
            coverageAmounts[i] = policy.coverageAmount;
            coverageEndDates[i] = policy.endTime;
            insuranceTypes[i] = disasterType;
        }
    }

    /// @notice Returns the list of claim moderators for the specified disaster event.
    function getClaimModerators(string calldata eventId) external view override returns (address[] memory) {
        require(bytes(disasterEvents[eventId].eventId).length != 0, "Event does not exist");
        return disasterEvents[eventId].claimModerators;
    }


    // Returns basic claim info: ID, PROJECT (disaster event name), CLAIM AMOUNT, and STATUS.
    function getAllClaims()
        external
        view
        override
        returns (
            uint[] memory,
            string[] memory,
            string[] memory,
            string[] memory
        )
    {
        uint256 claimsLength = claimRecords.length;
        uint[] memory claimIds = new uint[](claimsLength);
        string[] memory projects = new string[](claimsLength);
        string[] memory claimAmounts = new string[](claimsLength);
        string[] memory statuses = new string[](claimsLength);

        for (uint256 i = 0; i < claimsLength; i++) {
            ClaimRecord storage cr = claimRecords[i];
            claimIds[i] = cr.claimId;
            projects[i] = disasterEvents[cr.eventId].name;
            claimAmounts[i] = string(
                abi.encodePacked(cr.claimAmount.toString(), " ETH")
            );
            statuses[i] = getStatusString(cr.status);
        }
        return (claimIds, projects, claimAmounts, statuses);
    }

    /// @notice Returns claim data
    function getAllClaimSummaries()
        external
        view
        returns (
            uint256[] memory claimIds,
            string[] memory eventNames,
            uint256[] memory claimAmounts,
            uint256[] memory assessmentStarts,
            uint256[] memory assessmentEnds,
            uint8[] memory statuses
        )
    {
        uint256 count = claimRecords.length;
        claimIds = new uint256[](count);
        eventNames = new string[](count);
        claimAmounts = new uint256[](count);
        assessmentStarts = new uint256[](count);
        assessmentEnds = new uint256[](count);
        statuses = new uint8[](count);

        for (uint256 i = 0; i < count; i++) {
            ClaimRecord memory claim = claimRecords[i];
            claimIds[i] = claim.claimId;
            eventNames[i] = disasterEvents[claim.eventId].name;
            claimAmounts[i] = claim.claimAmount;
            assessmentStarts[i] = claim.assessmentStart;
            assessmentEnds[i] = claim.assessmentEnd;
            statuses[i] = uint8(claim.status);
        }
    }

    /// @notice Returns detailed information for a specific claim.
    /// For example, returns:
    /// - Claim ID (e.g., "22")
    /// - Project/event name
    /// - Purchase date (from the associated policy)
    /// - Expiry (assumed as 30 days after purchase)
    /// - Total cover amount and requested amount (with "ETH")
    /// - Claim status
    /// - incident details
    // Returns detailed claim data as raw values.
    function getClaimDetail(
        uint256 _claimId
    )
        external
        view
        returns (
            uint256 claimId,
            string memory eventName,
            uint256 purchaseDate,
            uint256 expiry,
            uint256 totalCoverAmount,
            uint256 requestedAmount,
            uint8 status,
            string memory incidentDescription
        )
    {
        require(_claimId > 0 && _claimId < nextClaimId, "Invalid claim id");
        ClaimRecord memory claim = claimRecords[_claimId - 1];
        Policy memory policy = policies[claim.policyId];
        return (
            claim.claimId,
            disasterEvents[claim.eventId].name,
            policy.startTime,
            policy.startTime + 30 days, // Example expiry period.
            policy.coverageAmount,
            claim.claimAmount,
            uint8(claim.status),
            claim.incidentDescription
        );
    }

    // ========================================
    // Internal Helper Functions
    // ========================================
    /// @dev Converts a ClaimStatus enum to its string representation.
    function getStatusString(
        ClaimStatus status
    ) internal pure returns (string memory) {
        if (status == ClaimStatus.Pending) return "Pending";
        if (status == ClaimStatus.Accepted) return "Accepted";
        if (status == ClaimStatus.Denied) return "Denied";
        return "";
    }

    // ========================================
    // View Helper Functions
    // ========================================
    /// @notice Returns the policy IDs for a given user.
    function getUserPolicies(
        address user
    ) external view returns (bytes32[] memory) {
        return userRecords[user].policyIds;
    }

    /// @notice Returns the claim IDs for a given user.
    function getUserClaims(
        address user
    ) external view returns (uint256[] memory) {
        return userRecords[user].claimIds;
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    /// @notice Returns all donors and their total donated amounts.
    function getAllDonors()
        external
        view
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

    // function getHighestDonors()
    //     external
    //     view
    //     override
    //     returns (address[] memory, uint256[] memory)
    // {}
}
