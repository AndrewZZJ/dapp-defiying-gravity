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
     * @dev Modifier that allows either the owner or the timelock controller to call a function
     */
    modifier onlyOwnerOrTimelock() {
        require(msg.sender == owner() || msg.sender == timelockController, "Unauthorized: caller is not owner or timelock");
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
    
    /**
     * @notice Constructs the DAO contract
     * @param _graviCha The address of the GraviCha token
     * @param _graviGov The address of the GraviGov token
     */
    constructor(address _graviCha, address _graviGov) Ownable(msg.sender) {
        graviCha = IGraviCha(_graviCha);
        graviGov = IGraviGov(_graviGov);
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
     * @param newRate The new charity token exchange rate
     * @param newPrice The new Ether price per governance token
     * @param newBurnAmount The new GraviCha burn amount per governance token purchase
     * @param mintAmount The monthly mint amount for governance tokens
     * @dev Only callable by the owner or timelock
     */
    function setGovernanceTokenParameters(
        uint256 newRate,
        uint256 newPrice,
        uint256 newBurnAmount,
        uint256 mintAmount
    ) external onlyOwnerOrTimelock {
        // Get the decimal precision of the GraviCha token.
        govTokenEthPrice = newPrice;
        govTokenGraviChaBurn = newBurnAmount;
        graviGov.setCharityTokenExchangeRate(newRate);
        graviGov.setMonthlyMintAmount(mintAmount);
    }
    
    /**
     * @notice Mints the monthly allotment of governance tokens
     * @dev Only callable by the owner or timelock
     */
    function monthlyMintGovTokens() external onlyOwnerOrTimelock {
        graviGov.mintMonthly();
    }
    
    /**
     * @notice Sets the monthly mint amount for governance tokens
     * @param newAmount The new monthly mint amount
     * @dev Only callable by the owner or timelock
     */
    function setMonthlyGovMintAmount(uint256 newAmount) external onlyOwnerOrTimelock {
        graviGov.setMonthlyMintAmount(newAmount);
    }
    
    /**
     * @notice Sets the charity token exchange rate
     * @param newRate The new exchange rate
     * @dev Only callable by the owner or timelock
     */
    function setCharityTokenExchangeRate(uint256 newRate) external onlyOwnerOrTimelock {
        graviGov.setCharityTokenExchangeRate(newRate);
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
     * @dev Only callable by the owner or timelock
     */
    function setNFTPool(address _nftPool) external onlyOwnerOrTimelock {
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
     * @dev Only callable by the owner or timelock
     */
    function addInsurancePool(string memory poolName, address insurancePool) external onlyOwnerOrTimelock {
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
     * @dev Only callable by the owner or timelock
     */
    function removeInsurancePool(string memory insuranceName) external onlyOwnerOrTimelock {
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
     * @dev Only callable by the owner or timelock
     */
    function monthlyMintNFTForPool(string memory insuranceName, string[] calldata tokenURIs) external onlyOwnerOrTimelock {
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
     * @dev Only callable by the owner or timelock
     */
    function moveEtherFromInsurance(string memory insuranceName, address payable recipient, uint256 amount) external onlyOwnerOrTimelock {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.transferEther(recipient, amount);
    }
}
