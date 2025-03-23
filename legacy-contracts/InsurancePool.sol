// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// import "./tokens/GraviCha.sol";


// contract InsurancePool is Ownable {
//     struct Policy {
//         address policyHolder;
//         uint256 coverageAmount;
//         uint256 premiumPaid;
//         uint256 startTime;
//         bool isClaimed;
//     }

//     string public disasterType;
//     uint256 public premiumRate; // e.g., 5% of coverage amount
//     uint256 public totalPoolFunds; //Total funds available for payouts
//     GraviCha public graviCha;

    
//     // The Ownership of the NFT is tracked by the GraviPoolNFT contract itself
//     // optional: if we want pool to keep track of the NFTs it owns
//     uint256[] public nftTokenIds;
//     GraviPoolNFT public graviPoolNFT;


//     mapping(address => Policy) public policies; //A map storing each user's insurance policy

//     event PolicyPurchased(address indexed user, uint256 coverage, uint256 premium);
//     event ClaimApproved(address indexed user, uint256 payout);
//     event FundsAdded(uint256 amount);

//     constructor(
//         string memory _disasterType,
//         uint256 _premiumRate,
//         address _graviCha,
//         address _graviPoolNFT
//     ) {
//         disasterType = _disasterType;
//         premiumRate = _premiumRate;
//         graviCha = GraviCha(_graviCha);
//         graviPoolNFT = GraviPoolNFT(_graviPoolNFT);
//     }


//     function buyInsurance(uint256 coverageAmount) external payable {
//         require(policies[msg.sender].coverageAmount == 0, "Already insured");

//         uint256 premium = (coverageAmount * premiumRate) / 100;
//         require(msg.value == premium, "Incorrect ETH amount sent");

//         policies[msg.sender] = Policy(msg.sender, coverageAmount, premium, block.timestamp, false);
//         totalPoolFunds += premium;

//         emit PolicyPurchased(msg.sender, coverageAmount, premium);
//     }

//     function approveClaim(address user) external onlyOwner {
//         Policy storage policy = policies[user];
//         require(policy.coverageAmount > 0, "No active policy");
//         require(!policy.isClaimed, "Already claimed");
//         require(totalPoolFunds >= policy.coverageAmount, "Insufficient funds");

//         policy.isClaimed = true;
//         totalPoolFunds -= policy.coverageAmount;

//         (bool success, ) = user.call{value: policy.coverageAmount}("");
//         require(success, "Payout failed");

//         emit ClaimApproved(user, policy.coverageAmount);
//     }

//     function donate() external payable onlyOwner {
//         require(msg.value > 0, "Donate amount must larger than 0ETH");
//         totalPoolFunds += msg.value;

//         // Todo: the owner of the Gravicha need to add InsurancePool as a minter
//         /* 
//             // call this from the owner of GraviCha
//             const graviCha = await ethers.getContractAt("GraviCha", graviChaAddress, signer);

//             await graviCha.addMinter(insurancePoolAddress);
//          */
//         // Mint 1 GraviCha token per 1 ETH donated (ratio 1:1, adjust as needed)
//         graviCha.mint(msg.sender, msg.value);
//         emit FundsAdded(msg.value);
//     }

//     // Allow receiving ETH via fallback
//     receive() external payable {
//         totalPoolFunds += msg.value;
//     }

//     //Todo:
//     //when donate, also mint Gravi Charity tokenzz
//     ////insurance pool owns GravipollNFT
//     //DAO call auction -> do NFT mint
// }
