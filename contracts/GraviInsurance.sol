// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IGraviDAO} from "./interfaces/IGraviDAO.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

contract GraviInsurance is Ownable {
    struct Policy {
        bytes32 policyId;
        address policyHolder;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        bool isClaimed;
    }

    string public disasterType;
    uint256 public premiumRate;
    uint256 public totalPoolFunds;

    // External token + NFT + DAO
    IGraviCha public graviCha;
    IGraviPoolNFT public graviPoolNFT;
    IGraviDAO public dao;

    // Stores all policy data by policyId
    mapping(bytes32 => Policy) public policies;
    // Maps users to a list of their policyIds
    mapping(address => bytes32[]) public userPolicyIds;
    // track contribution per user
    mapping(address => uint256) public donorTotals;

    // Stores tokenIds of NFTs minted by this contract
    uint256[] public nftTokenIds;

    event PolicyPurchased(address indexed user, bytes32 policyId, uint256 coverage, uint256 premium);
    event ClaimApproved(address indexed user, bytes32 policyId, uint256 payout);
    event FundsDonated(address indexed donor, uint256 amount, uint256 nftTokenId);

    constructor(
        string memory _disasterType,
        uint256 _premiumRate,
        address _graviCha,
        address _graviPoolNFT,
        address _dao
    ) Ownable(msg.sender) {
        require(_premiumRate > 0, "Invalid premium rate");
        disasterType = _disasterType;
        premiumRate = _premiumRate;
        graviCha = IGraviCha(_graviCha);
        graviPoolNFT = IGraviPoolNFT(_graviPoolNFT);
        dao = IGraviDAO(_dao);
    }


    /// @notice User buys an insurance policy using ETH
    /// @param coverageAmount The desired payout coverage
    /// @return policyId The unique hash-based ID for the policy
    function buyInsurance(uint256 coverageAmount) external payable returns (bytes32) {
        uint256 premium = (coverageAmount * premiumRate) / 100;
        require(msg.value == premium, "Incorrect ETH amount");

        // Create unique policyId using hash
        bytes32 policyId = keccak256(
            abi.encodePacked(address(this), msg.sender, coverageAmount, block.timestamp)
        );
        // Save policy to storage
        Policy memory policy = Policy({
            policyId: policyId,
            policyHolder: msg.sender,
            coverageAmount: coverageAmount,
            premiumPaid: premium,
            startTime: block.timestamp,
            isClaimed: false
        });

        policies[policyId] = policy;
        userPolicyIds[msg.sender].push(policyId);
        totalPoolFunds += premium;

        emit PolicyPurchased(msg.sender, policyId, coverageAmount, premium);
        return policyId;
    }


    function payoutClaim(bytes32 policyId) internal {
        Policy storage policy = policies[policyId];
        policy.isClaimed = true;
        totalPoolFunds -= policy.coverageAmount;

        (bool sent, ) = policy.policyHolder.call{value: policy.coverageAmount}("");
        require(sent, "ETH transfer failed");

        emit ClaimApproved(policy.policyHolder, policyId, policy.coverageAmount);
    }


    function processClaim(bytes32 policyId) external {
        Policy storage policy = policies[policyId];

        require(policy.policyHolder == msg.sender, "Not your policy");
        require(!policy.isClaimed, "Already claimed");
        require(policy.coverageAmount > 0, "Invalid policy");
        require(totalPoolFunds >= policy.coverageAmount, "Insufficient funds");

        // DAO approval (via on-chain rules)
        require(dao.verifyAndApproveClaim(policyId), "DAO verification failed");

        // Optional oracle check

        // Now proceed to payout
        payoutClaim(policyId);
    }


    /// @notice User donate ETH → receives GraviCha tokens + NFT + tracked contribution
    function donate(string memory nftMetadataURI) external payable {
        require(msg.value > 0, "Must send ETH");
        totalPoolFunds += msg.value;

        // Track total donations per user
        donorTotals[msg.sender] += msg.value;

        // Mint GraviCha tokens (1:1 with ETH donated)
        graviCha.mint(msg.sender, msg.value);

        // Mint NFT directly to this pool contract (owned by the pool)
        uint256 tokenId = graviPoolNFT.mintToPool(address(this), nftMetadataURI);
        nftTokenIds.push(tokenId);

        emit FundsDonated(msg.sender, msg.value, tokenId);
    }


    receive() external payable {
        totalPoolFunds += msg.value;
    }

    // View helpers
    function getUserPolicies(address user) external view returns (bytes32[] memory) {
        return userPolicyIds[user];
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function getOwnedNFTs() external view returns (uint256[] memory) {
        return nftTokenIds;
    }
}
