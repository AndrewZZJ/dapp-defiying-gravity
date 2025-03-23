// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
// import "./tokens/GraviCha.sol";


// contract InsuranceManager is Ownable {
//     mapping(string => address) public insurancePools;
//     GraviCha public graviCha;
//     GraviPoolNFT public graviPoolNFT;


//     event PoolCreated(string disasterType, address poolAddress);

//     constructor(address _graviCha, address _graviPoolNFT) {
//         graviCha = GraviCha(_graviCha);
//         graviPoolNFT = GraviPoolNFT(_graviPoolNFT);
//     }


//     function createInsurancePool(string memory disasterType, uint256 premiumRate) external onlyOwner {
//         require(insurancePools[disasterType] == address(0), "Pool already exists");

//         InsurancePool pool = new InsurancePool(disasterType, premiumRate, address(graviCha), address(graviPoolNFT));
//         insurancePools[disasterType] = address(pool);

//         emit PoolCreated(disasterType, address(pool));
//     }

//     function getPoolAddress(string memory disasterType) external view returns (address) {
//         return insurancePools[disasterType];
//     }
// }
