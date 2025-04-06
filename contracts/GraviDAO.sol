// GraviFeatures.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviGov} from "./interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

import {IGraviDAO} from "./interfaces/IGraviDAO.sol";

contract GraviDAO is IGraviDAO, Ownable {
    // Address of the TimelockController.
    address public timelockController;

    // Custom modifier that allows either the owner or the timelock controller.
    modifier onlyOwnerOrTimelock() {
        require(msg.sender == owner() || msg.sender == timelockController, "Unauthorized: caller is not owner or timelock");
        _;
    }

    // Token and pool references.
    IGraviCha public graviCha;
    IGraviGov public graviGov;
    
    // Governance token parameters.
    uint256 public govTokenEthPrice = 100 wei;
    uint256 public govTokenGraviChaBurn = 1;
    
    // Insurance and NFT pools.
    mapping(string => IGraviInsurance) public insurancePools;
    IGraviPoolNFT public nftPool;
    string[] public insurancePoolNames;
    
    // event InsuranceCreated(string disasterType, address poolAddress);
    // event InsuranceRemoved(string disasterType, address poolAddress);
    // event NFTPoolAdded(address poolAddress);
    // event NFTPoolRemoved(address poolAddress);
    // event GovTokensPurchased(address indexed buyer, uint256 amount);
    
    constructor(address _graviCha, address _graviGov) Ownable(msg.sender) {
        graviCha = IGraviCha(_graviCha);
        graviGov = IGraviGov(_graviGov);
    }

    // Setter function to update the timelock controller address.
    // This function can only be called by the owner.
    function setTimelockController(address _timelockController) external onlyOwner {
        require(_timelockController != address(0), "Timelock address cannot be zero");
        timelockController = _timelockController;
    }

    // Governance token management functions.
    function setGovernanceTokenParameters(
        uint256 newRate,
        uint256 newPrice,
        uint256 newBurnAmount,
        uint256 mintAmount
    ) external onlyOwnerOrTimelock {
        govTokenEthPrice = newPrice;
        govTokenGraviChaBurn = newBurnAmount;
        graviGov.setCharityTokenExchangeRate(newRate);
        graviGov.setMonthlyMintAmount(mintAmount);
    }
    
    function monthlyMintGovTokens() external onlyOwnerOrTimelock {
        graviGov.mintMonthly();
    }
    
    function setMonthlyGovMintAmount(uint256 newAmount) external onlyOwnerOrTimelock {
        graviGov.setMonthlyMintAmount(newAmount);
    }
    
    function setCharityTokenExchangeRate(uint256 newRate) external onlyOwnerOrTimelock {
        graviGov.setCharityTokenExchangeRate(newRate);
    }
    
    function purchaseGovTokens(uint256 amount) external payable {
        uint256 requiredEth = amount * govTokenEthPrice;
        require(msg.value >= requiredEth, "Insufficient Ether sent");
        require(graviGov.balanceOf(address(this)) >= amount, "Not enough governance tokens in pool");
        
        uint256 requiredCharityTokens = amount * govTokenGraviChaBurn;
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

    // Calculates the token purchase price per given governance tokens, in ETH and GraviCha
    function calculatesGovTokenPurchasePrice(
        uint256 amount
    ) external view returns (uint256 ethPrice, uint256 graviChaBurn) {
        return (amount * govTokenEthPrice, amount * govTokenGraviChaBurn);
    }
    
    // Insurance and NFT pool management.
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
    
    function removeInsurancePool(string memory insuranceName) external onlyOwnerOrTimelock {
        address insPool = address(insurancePools[insuranceName]);
        require(insPool != address(0), "Pool does not exist");
        graviCha.removeMinter(insPool);
        delete insurancePools[insuranceName];
        emit InsuranceRemoved(insuranceName, insPool);
    }
    
    function getInsurancePoolAddresses(string memory insuranceName) external view returns (address insurancePoolAddress, address nftPoolAddress) {
        insurancePoolAddress = address(insurancePools[insuranceName]);
        nftPoolAddress = address(nftPool);
    }
    
    function getAllInsurancePoolNames() external view returns (string[] memory) {
        return insurancePoolNames;
    }
    
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
    
    function moveEtherFromInsurance(string memory insuranceName, address payable recipient, uint256 amount) external onlyOwnerOrTimelock {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.transferEther(recipient, amount);
    }
}
