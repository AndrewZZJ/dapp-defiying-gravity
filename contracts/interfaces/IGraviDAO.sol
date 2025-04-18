// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGraviInsurance} from "../interfaces/IGraviInsurance.sol";
import {IGraviGov} from "../interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "../interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "../interfaces/tokens/IGraviPoolNFT.sol";

/**
 * @title IGraviDAO
 * @notice Interface for managing the governance tokens, insurance pools, and NFT operations
 * @dev Connects various components of the protocol under governance control
 */
interface IGraviDAO {
    // ---------------------------
    // State Variable Getters
    // ---------------------------
    
    /**
     * @notice Returns the timelock controller address
     * @return The address of the timelock controller
     */
    function timelockController() external view returns (address);

    /**
     * @notice Returns the instance of the GraviCha token
     * @return The GraviCha token interface
     */
    function graviCha() external view returns (IGraviCha);

    /**
     * @notice Returns the instance of the GraviGov token
     * @return The GraviGov token interface
     */
    function graviGov() external view returns (IGraviGov);

    /**
     * @notice Returns the governance token price in Ether
     * @return The price of governance tokens in wei
     */
    function govTokenEthPrice() external view returns (uint256);

    /**
     * @notice Returns the required GraviCha burn amount per governance token purchase
     * @return The amount of GraviCha to burn per governance token
     */
    function govTokenGraviChaBurn() external view returns (uint256);

    /**
     * @notice Returns the insurance pool instance associated with a given pool name
     * @param poolName The name of the insurance pool
     * @return The insurance pool interface
     */
    function insurancePools(string calldata poolName) external view returns (IGraviInsurance);

    /**
     * @notice Returns the current NFT pool instance
     * @return The NFT pool interface
     */
    function nftPool() external view returns (IGraviPoolNFT);

    /**
     * @notice Returns the insurance pool name at a specific index
     * @param index The index in the list of pool names
     * @return The name of the insurance pool
     */
    function insurancePoolNames(uint256 index) external view returns (string memory);

    // ---------------------------
    // Events
    // ---------------------------
    
    /**
     * @notice Emitted when a new insurance pool is created
     * @param disasterType The name identifying the insurance pool
     * @param poolAddress The address of the created insurance pool
     */
    event InsuranceCreated(string disasterType, address poolAddress);

    /**
     * @notice Emitted when an insurance pool is removed
     * @param disasterType The name identifying the removed insurance pool
     * @param poolAddress The address of the removed insurance pool
     */
    event InsuranceRemoved(string disasterType, address poolAddress);

    /**
     * @notice Emitted when an NFT pool is added
     * @param poolAddress The address of the added NFT pool
     */
    event NFTPoolAdded(address poolAddress);

    /**
     * @notice Emitted when an NFT pool is removed
     * @param poolAddress The address of the removed NFT pool
     */
    event NFTPoolRemoved(address poolAddress);

    /**
     * @notice Emitted when governance tokens are purchased
     * @param buyer The address of the purchaser
     * @param amount The number of governance tokens purchased
     */
    event GovTokensPurchased(address indexed buyer, uint256 amount);

    /**
     * @notice Emitted when a moderator is nominated
     * @param moderator The address of the nominated moderator
     * @param nominator The address that nominated the moderator
     * @param timestamp The timestamp when the nomination occurred
     */
    event ModeratorNominated(address indexed moderator, address indexed nominator, uint256 timestamp);

    /**
     * @notice Emitted when a moderator receives a vote
     * @param moderator The address of the moderator receiving the vote
     * @param voter The address that voted for the moderator
     * @param newTotalVotes The new total votes for the moderator
     */
    event ModeratorVoted(address indexed moderator, address indexed voter, uint256 newTotalVotes);

    /**
     * @notice Emitted when all moderators are reset
     * @param timestamp The timestamp when the reset occurred
     */
    event ModeratorsReset(uint256 timestamp);

    /**
     * @notice Emitted when moderator thresholds are updated
     * @param nominationThreshold The new threshold for nominating moderators
     * @param votingThreshold The new threshold for voting for moderators
     */
    event ModeratorThresholdsUpdated(uint256 nominationThreshold, uint256 votingThreshold);
    
    /**
     * @notice Emitted when a nomination reward is claimed
     * @param nominator The address that nominated a moderator
     * @param moderator The address of the nominated moderator
     * @param amount The amount of GraviCha tokens rewarded
     */
    event ModeratorNominationRewarded(address indexed nominator, address indexed moderator, uint256 amount);
    
    /**
     * @notice Emitted when a voting reward is claimed
     * @param voter The address that voted for a moderator
     * @param moderator The address of the moderator voted for
     * @param amount The amount of GraviCha tokens rewarded
     */
    event ModeratorVoteRewarded(address indexed voter, address indexed moderator, uint256 amount);
    
    /**
     * @notice Emitted when moderator rewards are enabled or disabled
     * @param enabled Whether rewards are enabled
     */
    event ModeratorRewardsToggled(bool enabled);
    
    /**
     * @notice Emitted when moderator reward amounts are updated
     * @param nominationReward The new reward amount for nominations
     * @param votingReward The new reward amount for voting
     */
    event ModeratorRewardAmountsUpdated(uint256 nominationReward, uint256 votingReward);

    // ---------------------------
    // Governance and Token Management Functions
    // ---------------------------

    /**
     * @notice Sets the timelock controller address
     * @param _timelockController The new timelock controller address
     * @dev Callable only by the contract owner
     */
    function setTimelockController(address _timelockController) external;

    /**
     * @notice Sets governance token parameters including exchange rate, price, burn amount, and mint amount
     * @param newPrice The new Ether price per governance token
     * @param newBurnAmount The new GraviCha burn amount per governance token purchase
     * @param mintAmount The monthly mint amount for governance tokens
     * @dev Callable by the owner or the timelock controller
     */
    function setGovernanceTokenParameters(
        uint256 newPrice,
        uint256 newBurnAmount,
        uint256 mintAmount
    ) external;

    /**
     * @notice Mints the monthly allotment of governance tokens
     * @dev Callable by the owner or the timelock controller
     */
    function monthlyMintGovTokens() external;

    /**
     * @notice Sets the monthly mint amount for governance tokens
     * @param newAmount The new monthly mint amount
     * @dev Callable by the owner or the timelock controller
     */
    function setMonthlyGovMintAmount(uint256 newAmount) external;

    /**
     * @notice Allows a user to purchase governance tokens
     * @param amount The number of governance tokens to purchase
     * @dev The function transfers governance tokens after burning charity tokens and handling Ether payments
     */
    function purchaseGovTokens(uint256 amount) external payable;

    /**
     * @notice Calculates the Ether cost and GraviCha burn amount required to purchase governance tokens
     * @param amount The number of governance tokens
     * @return ethPrice The total Ether required
     * @return graviChaBurn The total GraviCha tokens to burn
     */
    function calculatesGovTokenPurchasePrice(
        uint256 amount
    ) external view returns (uint256 ethPrice, uint256 graviChaBurn);

    // ---------------------------
    // NFT and Insurance Pool Management Functions
    // ---------------------------

    /**
     * @notice Sets or updates the NFT pool used by the DAO
     * @param _nftPool The address of the new NFT pool
     * @dev Callable by the owner or the timelock controller
     */
    function setNFTPool(address _nftPool) external;

    /**
     * @notice Adds a new insurance pool with a specified name
     * @param poolName The identifier for the insurance pool
     * @param insurancePool The address of the insurance pool
     * @dev Callable by the owner or the timelock controller
     */
    function addInsurancePool(string calldata poolName, address insurancePool) external;

    /**
     * @notice Removes an existing insurance pool by its name
     * @param insuranceName The identifier of the insurance pool to remove
     * @dev Callable by the owner or the timelock controller
     */
    function removeInsurancePool(string calldata insuranceName) external;

    /**
     * @notice Retrieves the addresses of an insurance pool and the NFT pool associated with it
     * @param insuranceName The identifier of the insurance pool
     * @return insurancePoolAddress The address of the insurance pool
     * @return nftPoolAddress The address of the NFT pool
     */
    function getInsurancePoolAddresses(
        string calldata insuranceName
    ) external view returns (address insurancePoolAddress, address nftPoolAddress);

    /**
     * @notice Returns all insurance pool names managed by the DAO
     * @return An array containing all insurance pool names
     */
    function getAllInsurancePoolNames() external view returns (string[] memory);

    /**
     * @notice Mints NFTs for a specified insurance pool and triggers an auction
     * @param insuranceName The identifier of the insurance pool
     * @param tokenURIs An array of token URIs for the NFTs to be minted and auctioned
     * @dev Callable by the owner or the timelock controller
     */
    function monthlyMintNFTForPool(
        string calldata insuranceName,
        string[] calldata tokenURIs
    ) external;

    /**
     * @notice Transfers Ether from a specified insurance pool to a recipient
     * @param insuranceName The identifier of the insurance pool
     * @param recipient The address to receive the Ether
     * @param amount The amount of Ether to transfer
     * @dev Callable by the owner or the timelock controller
     */
    function moveEtherFromInsurance(
        string calldata insuranceName,
        address payable recipient,
        uint256 amount
    ) external;

    // ---------------------------
    // Insurance Claims Moderator System
    // ---------------------------

    /**
     * @notice Enables or disables moderator rewards
     * @param enabled Whether rewards should be enabled
     */
    function toggleModeratorRewards(bool enabled) external;
    
    /**
     * @notice Updates the reward amounts for moderator nominations and voting
     * @param newNominationReward The new reward amount for nominations
     * @param newVotingReward The new reward amount for voting
     */
    function setModeratorRewardAmounts(uint256 newNominationReward, uint256 newVotingReward) external;

    /**
     * @notice Nominates an address as a claims moderator
     * @param _moderator The address to nominate as a moderator
     */
    function nominateModerator(address _moderator) external;

    /**
     * @notice Allows governance token holders to vote for a nominated moderator
     * @param _moderator The address of the nominated moderator to vote for
     */
    function voteForModerator(address _moderator) external;

    /**
     * @notice Resets all moderator nominations and votes
     */
    function resetModerators() external;

    /**
     * @notice Updates the thresholds for moderator nomination and voting
     * @param _nominationThreshold New threshold for nominating a moderator
     * @param _votingThreshold New threshold for voting for a moderator
     */
    function setModeratorThresholds(uint256 _nominationThreshold, uint256 _votingThreshold) external;

    /**
     * @notice Gets the top voted moderators
     * @param _count The number of top moderators to return
     * @return moderators Array of moderator addresses
     * @return votes Array of vote counts corresponding to the moderators
     */
    function getTopModerators(uint256 _count) external view returns (address[] memory moderators, uint256[] memory votes);

    /**
     * @notice Checks if an address is among the top moderators
     * @param _moderator The moderator address to check
     * @param _topCount How many top moderators to consider
     * @return isATopModerator True if the address is in the top moderators
     * @return rank The rank of the moderator (0 if not in top)
     */
    function isTopModerator(address _moderator, uint256 _topCount) external view returns (bool isATopModerator, uint256 rank);

    /**
     * @notice Gets the total number of nominated moderators
     * @return count The number of nominated moderators
     */
    function getNominatedModeratorCount() external view returns (uint256 count);

    /**
     * @notice Gets all nominated moderators with their votes
     * @return moderators Array of moderator addresses
     * @return votes Array of vote counts
     * @return nominators Array of nominator addresses
     */
    function getAllNominatedModerators() external view returns (
        address[] memory moderators, 
        uint256[] memory votes,
        address[] memory nominators
    );
    
    /**
     * @notice Returns the current moderator reward information
     * @return isEnabled Whether moderator rewards are enabled
     * @return nominationReward The nomination reward amount
     * @return votingReward The voting reward amount
     */
    function getModeratorRewardInfo() external view returns (
        bool isEnabled, 
        uint256 nominationReward, 
        uint256 votingReward
    );
}
