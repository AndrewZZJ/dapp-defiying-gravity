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
        uint256 maxCoverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        uint256 endTime;          // End time of the insurance policy
        bool isClaimed;
        string propertyAddress;   // property address
        uint256 propertyValue;    // Value of the property (in ETH)
    }

    // Enum for claim statuses.
    enum ClaimStatus {
        Pending,
        Accepted,
        Denied
    }
    // Struct to track each moderator's decision on a claim.
    struct ModeratorInfo {
        Moderator moderator;     // Moderator Info
        bool hasDecided;        // Whether the moderator has given their decision
        bool isApproved;        // Whether the moderator approved the claim
        uint256 approvedAmount; // Amount the moderator approved
    }
    // Claim record structure, associated with both a policy and a disaster event.
    struct ClaimRecord {
        uint256 claimId; // Auto-incremented claim ID.
        bytes32 policyId; // Associated policy.
        string eventId; // Associated disaster event (string ID, e.g., "EVT#1").
        uint256 approvedClaimAmount; // The final approved amount.
        uint256 assessmentStart; // Timestamp when claim assessment starts.
        uint256 assessmentEnd; // Timestamp when claim assessment ends.
        ClaimStatus status; // Current claim status.
        string incidentDescription; // Details about the incident.
        ModeratorInfo[] moderatorTeam; // Array of moderator decisions
    }
    // Disaster event structure.
    struct DisasterEvent {
        string eventId; // Auto-generated unique id as a string, e.g., "EVT#1".
        string name; // Human-readable event name.
        uint256 disasterDate;
        string eventDescription;
    }
    // Consolidated user record that stores all data related to a user.
    struct UserRecord {
        bytes32[] policyIds;
        uint256[] claimIds;
        uint256 donationTotal;
    }
    struct Moderator {
        address moderatorAddress;      // Moderator address
        uint256 maxApprovalAmount;     // The maximum amount this moderator can approve per claim
        uint256 totalClaimsAssessed;   // Total number of claims this moderator has assessed
        uint256 totalClaimsApproved;   // Total number of claims this moderator has approved
        uint256 totalApprovedAmount;   // Total amount approved across all claims
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
        uint256 divisor = 10000; // Example divisor;
        
        premium = (propertyValue * coveragePeriod * addressFactor) / divisor;
    }

    /// @notice Calculates a mocked MAX coverage amount based solely on the premium and a fixed ratio.
    /// @param premium The premium paid (in ETH).
    /// @return coverageAmount The resulting coverage amount (in ETH).
    function calculateCoverageAmountFromPremium(uint256 premium) public pure returns (uint256 coverageAmount) {
        // Define a fixed ratio. For example, if the ratio is 5, then coverage = 5 * premium.
        uint256 ratio = 5;
        coverageAmount = premium * ratio;
    }

    /// @notice Gets the donation reward rate.
    /// @return The donation exchange rate.
    function getDonationRewardRate() external view returns (uint256) {
        return donationRewardRate;
    }

    /// @notice Sets the donation reward rate. (1 ETH to X GraviCha)
    function setDonationRewardRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Invalid rate");
        donationRewardRate = newRate;
    }

    /// @notice Donate ETH to the pool and receive tokens/NFT.
    /// @return tokensReceived The amount of charity tokens minted for this donation.
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

        graviCha.mint(msg.sender, msg.value * donationRewardRate);

        emit FundsDonated(msg.sender, tokensReceived);
        return msg.value * donationRewardRate;
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


    /// @notice Adds a new moderator to the pool if not already present.
    /// @param _moderatorAddress The address of the moderator to be added.
    /// @param maxAmount The maximum claim amount the moderator can approve.
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

    /// @notice Removes a moderator from the pool.
    /// @param moderator The address of the moderator to be removed.
    function removeModeratorFromPool(address moderator) external override onlyOwner {
        require(moderator != address(0), "Invalid moderator address");
        require(moderators[moderator].maxApprovalAmount != 0, "Moderator does not exist");

        // Delete the moderator from the mapping
        delete moderators[moderator];

        emit ModeratorRemoved(moderator);
    }

    function transferEther(
        address payable recipient,
        uint256 amount
    ) external payable override onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Transfer failed");
    }


    /// @notice Starts a new claim for the given policy and event.
    /// @param eventId The ID of the disaster event.
    /// @param policyId The ID of the insurance policy.
    /// @param incidentDescription A description of the incident.
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


    /// @notice Processes the claim to determine the final decision based on moderator votes.
    /// @param claimId The ID of the claim to process.
    function processClaim(uint256 claimId) external override {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");

        // Access the claim record from the array
        ClaimRecord storage claim = claimRecords[claimId - 1];
        require(claim.status == ClaimStatus.Pending, "Claim already finalized");

        uint256 totalModerators = claim.moderatorTeam.length;
        require(totalModerators >= 3, "Not enough moderators have assessed this claim");

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



    /// @notice Allows a moderator to assess a claim by approving or denying it.
    /// @param claimId The ID of the claim being assessed.
    /// @param isApproved A boolean indicating whether the claim is approved (true) or denied (false).
    /// @param amount The amount the moderator approves (if isApproved is true).
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




    /// @notice Executes payout for a processed claim.
    /// Only the contract owner can call this function.
    /// @param claimId The ID of the claim to process for payout.
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
    // View Functions
    // ========================================

    /// @notice Returns the policy IDs for a given user.
    function fetchInsuranceIds(
        address user
    ) external view override returns (bytes32[] memory) {
        return userRecords[user].policyIds;
    }
    /// @notice Returns the insurance (policy) details for the user.
    /// @return user The caller's address.
    /// @return policyIds An array of policy IDs held by the user.
    /// @return propertyAddresses An array of the property addresses.
    /// @return maxCoverageAmounts An array of coverage amounts (in ETH).
    /// @return coverageEndDates An array of the policy end times (as Unix timestamps).
    /// @return insuranceTypes An array of insurance types (e.g., "fire", "flood", "earthquake").

    function getUserPolicies() external view override returns (
        address user,
        bytes32[] memory policyIds,
        string[] memory propertyAddresses,
        uint256[] memory maxCoverageAmounts,
        uint256[] memory coverageEndDates,
        string[] memory insuranceTypes
    ) {
        user = msg.sender;
        uint256 count = userRecords[msg.sender].policyIds.length;
        policyIds = new bytes32[](count);
        propertyAddresses = new string[](count);
        maxCoverageAmounts = new uint256[](count);
        coverageEndDates = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            bytes32 pid = userRecords[msg.sender].policyIds[i];
            Policy memory policy = policies[pid];
            policyIds[i] = pid;
            propertyAddresses[i] = policy.propertyAddress;
            maxCoverageAmounts[i] = policy.maxCoverageAmount;
            coverageEndDates[i] = policy.endTime;
            insuranceTypes[i] = disasterType;
        }
    }


    /// @notice Returns the addresses of all moderators assigned to a specific claim.
    /// @param claimId The ID of the claim to retrieve moderators for.
    /// @return moderatorAddresses An array of moderator addresses.
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

    /// @notice Returns the claims associated with the user.
    /// @return claimIds An array of claim IDs held by the user.
    /// @return policyIds An array of policy IDs associated with the claims.
    /// @return moderatorList An array of arrays containing the addresses of moderators who assessed each claim.
    /// @return statuses An array of claim statuses.
    /// @return descriptions An array of claim descriptions.
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


    /// @notice Returns all donors and their total donated amounts.
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

    /// @notice Returns the top 10 highest donors based on the total donation amount.
    /// @return topDonors An array of the top 10 donor addresses.
    /// @return topAmounts An array of the corresponding donation amounts.
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

}
