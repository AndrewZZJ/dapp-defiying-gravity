// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IGraviPoolNFT is IERC721 {
    /// @notice Allows the owner to update the transfer fee.
    function setTransferFee(uint256 _transferFee) external;
    
    /// @notice Transfers an NFT with fee collection sent as ETH to the treasury.
    function transferWithFee(
        address from,
        address to,
        uint256 tokenId
    ) external payable;
    
    /// @notice Mints a new NFT to the specified pool address.
    function mintToPool(address poolAddress, uint8 treasuryIndex, string memory tokenURI) external returns (uint256);
    
    /// @notice Starts an auction for a newly minted NFT.
    function mintAndAuctionNFTs(string[] memory tokenURIs, address[] memory insuranceAddresses) external;
    
    /// @notice Places a bid for an active auction using ERC20 tokens.
    function bid(uint256 tokenId, uint256 bidAmount) external;
    
    /// @notice Allows outbid bidders to withdraw their refundable bid tokens.
    function withdraw() external;
    
    /// @notice Claims the NFT after winning the auction.
    function claimNFT(uint256 tokenId) external;
    
    /// @notice Forcefully ends an auction and assigns the NFT to the highest bidder.
    function forceEndAuction(uint256 tokenId) external;
    
    // /// @notice Updates the treasury address.
    // function setTreasury(address _treasury) external;
    
    /// @notice Updates the auction duration.
    function setAuctionDuration(uint256 _auctionDuration) external;
    
    /// @notice Updates the ERC20 token used for bidding and donations.
    function setToken(address _token) external;
    
    /// @notice Burns excess ERC20 tokens held by the contract.
    function burnExcessTokens(uint256 amount) external;
    
    /// @notice Burns an NFT (e.g., in case of emergency).
    function burn(uint256 tokenId) external;

    /// @notice Get auctioned NFT lists
    function getAuctionedNFTs() external returns (uint256[] memory);

    /// @notice Get auction details for a specific NFT.
    function getAuctionDetails(uint256 tokenId) external returns (
        uint256 auctionedTokenId,
        address highestBidder,
        uint256 highestBid,
        bool ended,
        uint256 startTime
    );

    function addTreasuryAddress(address treasury) external;
    function getTreasuryAddresses() external view returns (address[] memory);

    // function getTreasuryAddress(uint8 index) external view returns (address);
    // function getTreasuryIndex(uint256 tokenId) external view returns (uint8);
    
    function getTreasuryAddress(uint256 tokenId) external view returns (address);
    function setTreasuryAddress(uint8 index, address treasury) external;
    function transferWithDonation(address from, address to, uint256 tokenId ) external payable;

    function getTreasuryIndexByAddress(address treasuryAddress) external view returns (uint8);
}