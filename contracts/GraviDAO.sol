// GraviFeatures.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviGov} from "./interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

import {IGraviDAO} from "./interfaces/IGraviDAO.sol";

/**
 * @title GraviDAO
 * @notice DAO contract that manages governance tokens, insurance pools, and NFT operations
 * @dev This contract serves as the central manager of the protocol components
 */
contract GraviDAO is IGraviDAO, Ownable {
    // Address of the TimelockController.
    address public timelockController;

    /**
     * @dev Modifier that allows only governance (owner or timelock) to call a function
     */
    modifier onlyGovernance() {
        require(msg.sender == owner() || msg.sender == timelockController, "Unauthorized: not governance");
        _;
    }

    // Token and pool references.
    IGraviCha public graviCha;
    IGraviGov public graviGov;
    
    // Governance token parameters.
    uint256 public govTokenEthPrice = 0.01 ether; // Price in wei for 1 governance token.
    uint256 public govTokenGraviChaBurn = 10 ether;
    
    // Insurance and NFT pools.
    mapping(string => IGraviInsurance) public insurancePools;
    IGraviPoolNFT public nftPool;
    string[] public insurancePoolNames;
    
    // Insurance claims moderator system
    struct ModeratorNomination {
        address moderator;      // Moderator address
        address nominator;      // Address that nominated this moderator
        uint256 votes;          // Total votes received
        uint256 nominatedAt;    // Timestamp when nominated
    }

    // Thresholds for nomination and voting
    uint256 public moderatorNominationThreshold = 100 ether; // Default: 100 GGOV tokens needed to nominate
    uint256 public moderatorVotingThreshold = 1 ether;     // Default: 1 GGOV tokens needed to vote
    uint256 public lastModeratorResetTimestamp;            // Last time moderators were reset
    
    // Moderator tracking
    mapping(address => ModeratorNomination) public nominatedModerators;
    address[] public allNominatedModerators;
    mapping(address => mapping(address => bool)) public hasVotedForModerator; // voter => moderator => hasVoted

    /**
     * @notice Constructs the DAO contract
     * @param _graviCha The address of the GraviCha token
     * @param _graviGov The address of the GraviGov token
     */
    constructor(address _graviCha, address _graviGov) Ownable(msg.sender) {
        graviCha = IGraviCha(_graviCha);
        graviGov = IGraviGov(_graviGov);
        lastModeratorResetTimestamp = block.timestamp;
    }

    /**
     * @notice Sets the timelock controller address
     * @param _timelockController The new timelock controller address
     * @dev Only callable by the contract owner
     */
    function setTimelockController(address _timelockController) external onlyOwner {
        require(_timelockController != address(0), "Timelock address cannot be zero");
        timelockController = _timelockController;
    }

    /**
     * @notice Sets governance token parameters
     * @param newPrice The new Ether price per governance token
     * @param newBurnAmount The new GraviCha burn amount per governance token purchase
     * @param mintAmount The monthly mint amount for governance tokens
     * @dev Only callable by governance
     */
    function setGovernanceTokenParameters(
        uint256 newPrice,
        uint256 newBurnAmount,
        uint256 mintAmount
    ) external onlyGovernance {
        // Get the decimal precision of the GraviCha token.
        govTokenEthPrice = newPrice;
        govTokenGraviChaBurn = newBurnAmount;
        graviGov.setMonthlyMintAmount(mintAmount);
    }

    /**
     * @notice Mints the monthly allotment of governance tokens
     * @dev Only callable by governance
     */
    function monthlyMintGovTokens() external onlyGovernance {
        graviGov.mintMonthly();
    }
    
    /**
     * @notice Sets the monthly mint amount for governance tokens
     * @param newAmount The new monthly mint amount
     * @dev Only callable by governance
     */
    function setMonthlyGovMintAmount(uint256 newAmount) external onlyGovernance {
        graviGov.setMonthlyMintAmount(newAmount);
    }
    
    /**
     * @notice Allows a user to purchase governance tokens
     * @param amount The number of governance tokens to purchase
     * @dev Burns charity tokens and requires ETH payment
     */
    function purchaseGovTokens(uint256 amount) external payable {
        uint256 requiredEth = amount * govTokenEthPrice / 10 ** 18;
        require(msg.value >= requiredEth, "Insufficient Ether sent");
        require(graviGov.balanceOf(address(this)) >= amount, "Not enough governance tokens in pool");
        
        uint256 requiredCharityTokens = amount * govTokenGraviChaBurn / 10 ** 18;
        require(graviCha.balanceOf(msg.sender) >= requiredCharityTokens, "Insufficient charity tokens");
        
        graviCha.burnFrom(msg.sender, requiredCharityTokens);
        require(graviGov.transfer(msg.sender, amount), "Gov token transfer failed");
        
        uint256 excess = msg.value - requiredEth;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit GovTokensPurchased(msg.sender, amount);
    }

    /**
     * @notice Calculates the token purchase price per given governance tokens
     * @param amount The number of governance tokens
     * @return ethPrice The total Ether required
     * @return graviChaBurn The total GraviCha tokens to burn
     */
    function calculatesGovTokenPurchasePrice(
        uint256 amount
    ) external view returns (uint256 ethPrice, uint256 graviChaBurn) {
        return (amount * govTokenEthPrice, amount * govTokenGraviChaBurn);
    }
    
    /**
     * @notice Sets or updates the NFT pool used by the DAO
     * @param _nftPool The address of the new NFT pool
     * @dev Only callable by governance
     */
    function setNFTPool(address _nftPool) external onlyGovernance {
        require(address(_nftPool) != address(0), "NFT pool address cannot be zero");
        require(Ownable(_nftPool).owner() == address(this), "DAO must own NFT pool");
        
        IGraviPoolNFT newNftPool = IGraviPoolNFT(_nftPool);
        if (address(nftPool) != address(0)) {
            graviCha.removeMinter(address(nftPool));
            emit NFTPoolRemoved(address(nftPool));
        }
        nftPool = newNftPool;
        graviCha.addMinter(_nftPool);
        emit NFTPoolAdded(_nftPool);
    }
    
    /**
     * @notice Adds a new insurance pool with a specified name
     * @param poolName The identifier for the insurance pool
     * @param insurancePool The address of the insurance pool
     * @dev Only callable by governance
     */
    function addInsurancePool(string memory poolName, address insurancePool) external onlyGovernance {
        require(address(insurancePools[poolName]) == address(0), "Insurance pool already exists");
        require(address(nftPool) != address(0), "NFT pool must be set before adding insurance pool");
        require(Ownable(insurancePool).owner() == address(this), "DAO must own insurance pool");
        
        nftPool.addTreasuryAddress(insurancePool);
        insurancePools[poolName] = IGraviInsurance(insurancePool);
        insurancePoolNames.push(poolName);
        graviCha.addMinter(insurancePool);
        emit InsuranceCreated(poolName, insurancePool);
    }
    
    /**
     * @notice Removes an existing insurance pool by its name
     * @param insuranceName The identifier of the insurance pool to remove
     * @dev Only callable by governance
     */
    function removeInsurancePool(string memory insuranceName) external onlyGovernance {
        address insPool = address(insurancePools[insuranceName]);
        require(insPool != address(0), "Pool does not exist");
        graviCha.removeMinter(insPool);
        delete insurancePools[insuranceName];
        emit InsuranceRemoved(insuranceName, insPool);
    }
    
    /**
     * @notice Retrieves the addresses of an insurance pool and the NFT pool
     * @param insuranceName The identifier of the insurance pool
     * @return insurancePoolAddress The address of the insurance pool
     * @return nftPoolAddress The address of the NFT pool
     */
    function getInsurancePoolAddresses(string memory insuranceName) external view returns (address insurancePoolAddress, address nftPoolAddress) {
        insurancePoolAddress = address(insurancePools[insuranceName]);
        nftPoolAddress = address(nftPool);
    }
    
    /**
     * @notice Returns all insurance pool names managed by the DAO
     * @return An array containing all insurance pool names
     */
    function getAllInsurancePoolNames() external view returns (string[] memory) {
        return insurancePoolNames;
    }
    
    /**
     * @notice Mints NFTs for a specified insurance pool and triggers an auction
     * @param insuranceName The identifier of the insurance pool
     * @param tokenURIs An array of token URIs for the NFTs
     * @dev Only callable by governance
     */
    function monthlyMintNFTForPool(string memory insuranceName, string[] calldata tokenURIs) external onlyGovernance {
        address nftPoolAddress = address(nftPool);
        require(nftPoolAddress != address(0), "NFT pool not found");
        address insuranceAddress = address(insurancePools[insuranceName]);
        require(insuranceAddress != address(0), "Insurance pool not found");
        address[] memory insuranceAddresses = new address[](tokenURIs.length);
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            insuranceAddresses[i] = insuranceAddress;
        }
        IGraviPoolNFT pool = IGraviPoolNFT(nftPoolAddress);
        pool.mintAndAuctionNFTs(tokenURIs, insuranceAddresses);
    }
    
    /**
     * @notice Transfers Ether from a specified insurance pool to a recipient
     * @param insuranceName The identifier of the insurance pool
     * @param recipient The address to receive the Ether
     * @param amount The amount of Ether to transfer
     * @dev Only callable by governance
     */
    function moveEtherFromInsurance(string memory insuranceName, address payable recipient, uint256 amount) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.transferEther(recipient, amount);
    }

    // --------------------------------
    // Insurance Claims Moderator System
    // --------------------------------

    /**
     * @notice Nominates an address as a claims moderator
     * @param _moderator The address to nominate as a moderator
     * @dev Requires the nominator to hold a minimum number of governance tokens
     */
    function nominateModerator(address _moderator) external {
        require(_moderator != address(0), "Cannot nominate zero address");
        require(nominatedModerators[_moderator].moderator == address(0), "Already nominated");
        require(graviGov.balanceOf(msg.sender) >= moderatorNominationThreshold, "Insufficient governance tokens");
        
        nominatedModerators[_moderator] = ModeratorNomination({
            moderator: _moderator,
            nominator: msg.sender,
            votes: 0,
            nominatedAt: block.timestamp
        });
        allNominatedModerators.push(_moderator);
        
        emit ModeratorNominated(_moderator, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Allows governance token holders to vote for a nominated moderator
     * @param _moderator The address of the nominated moderator to vote for
     * @dev Requires the voter to hold a minimum number of governance tokens
     */
    function voteForModerator(address _moderator) external {
        require(nominatedModerators[_moderator].moderator != address(0), "Not nominated");
        require(!hasVotedForModerator[msg.sender][_moderator], "Already voted");
        require(graviGov.balanceOf(msg.sender) >= moderatorVotingThreshold, "Insufficient governance tokens");
        
        hasVotedForModerator[msg.sender][_moderator] = true;
        nominatedModerators[_moderator].votes += 1;
        
        emit ModeratorVoted(_moderator, msg.sender, nominatedModerators[_moderator].votes);
    }
    
    /**
     * @notice Resets all moderator nominations and votes
     * @dev Only callable by governance, typically done annually
     */
    function resetModerators() external onlyGovernance {
        for (uint256 i = 0; i < allNominatedModerators.length; i++) {
            address moderator = allNominatedModerators[i];
            delete nominatedModerators[moderator];
        }
        
        delete allNominatedModerators;
        lastModeratorResetTimestamp = block.timestamp;
        
        emit ModeratorsReset(block.timestamp);
    }
    
    /**
     * @notice Updates the thresholds for moderator nomination and voting
     * @param _nominationThreshold New threshold for nominating a moderator
     * @param _votingThreshold New threshold for voting for a moderator
     * @dev Only callable by governance
     */
    function setModeratorThresholds(uint256 _nominationThreshold, uint256 _votingThreshold) external onlyGovernance {
        moderatorNominationThreshold = _nominationThreshold;
        moderatorVotingThreshold = _votingThreshold;
        
        emit ModeratorThresholdsUpdated(_nominationThreshold, _votingThreshold);
    }
    
    /**
     * @notice Gets the top voted moderators
     * @param _count The number of top moderators to return
     * @return moderators Array of moderator addresses
     * @return votes Array of vote counts corresponding to the moderators
     */
    function getTopModerators(uint256 _count) external view returns (address[] memory moderators, uint256[] memory votes) {
        // Determine how many moderators to return
        uint256 count = _count > allNominatedModerators.length ? allNominatedModerators.length : _count;
        
        // Create temporary arrays for sorting
        address[] memory tempModerators = new address[](allNominatedModerators.length);
        uint256[] memory tempVotes = new uint256[](allNominatedModerators.length);
        
        // Fill arrays with current data
        for (uint256 i = 0; i < allNominatedModerators.length; i++) {
            address moderator = allNominatedModerators[i];
            tempModerators[i] = moderator;
            tempVotes[i] = nominatedModerators[moderator].votes;
        }
        
        // Sort arrays by votes (simple bubble sort)
        for (uint256 i = 0; i < tempModerators.length; i++) {
            for (uint256 j = i + 1; j < tempModerators.length; j++) {
                if (tempVotes[i] < tempVotes[j]) {
                    // Swap votes
                    uint256 tempVote = tempVotes[i];
                    tempVotes[i] = tempVotes[j];
                    tempVotes[j] = tempVote;
                    
                    // Swap moderators
                    address tempModerator = tempModerators[i];
                    tempModerators[i] = tempModerators[j];
                    tempModerators[j] = tempModerator;
                }
            }
        }
        
        // Create return arrays with the requested count
        moderators = new address[](count);
        votes = new uint256[](count);
        
        // Fill return arrays with top moderators
        for (uint256 i = 0; i < count; i++) {
            moderators[i] = tempModerators[i];
            votes[i] = tempVotes[i];
        }
        
        return (moderators, votes);
    }
    
    /**
     * @notice Checks if an address is among the top moderators
     * @param _moderator The moderator address to check
     * @param _topCount How many top moderators to consider
     * @return isATopModerator True if the address is in the top moderators
     * @return rank The rank of the moderator (0 if not in top)
     */
    function isTopModerator(address _moderator, uint256 _topCount) external view returns (
        bool isATopModerator, uint256 rank) {
        (address[] memory topModerators,) = this.getTopModerators(_topCount);
        
        for (uint256 i = 0; i < topModerators.length; i++) {
            if (topModerators[i] == _moderator) {
                return (true, i + 1);
            }
        }
        
        return (false, 0);
    }
    
    /**
     * @notice Gets the total number of nominated moderators
     * @return count The number of nominated moderators
     */
    function getNominatedModeratorCount() external view returns (uint256 count) {
        return allNominatedModerators.length;
    }
    
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
    ) {
        moderators = new address[](allNominatedModerators.length);
        votes = new uint256[](allNominatedModerators.length);
        nominators = new address[](allNominatedModerators.length);
        
        for (uint256 i = 0; i < allNominatedModerators.length; i++) {
            address moderator = allNominatedModerators[i];
            moderators[i] = moderator;
            votes[i] = nominatedModerators[moderator].votes;
            nominators[i] = nominatedModerators[moderator].nominator;
        }
        
        return (moderators, votes, nominators);
    }
}
