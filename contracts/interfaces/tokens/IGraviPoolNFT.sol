// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title IGraviPoolNFT
 * @notice Interface for the GraviPoolNFT contract that represents ownership in insurance pools
 * @dev Defines the external functions that the GraviPoolNFT contract must implement
 */
interface IGraviPoolNFT {
    /**
     * @notice Updates the fee for transferring NFTs
     * @param _transferFee The new fee amount in wei
     */
    function setTransferFee(uint256 _transferFee) external;
    
    /**
     * @notice Transfers an NFT with a fee sent to the treasury
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param tokenId ID of the NFT to transfer
     */
    function transferWithFee(
        address from,
        address to,
        uint256 tokenId
    ) external payable;
    
    /**
     * @notice Mints a new NFT directly to an insurance pool
     * @param poolAddress Address of the pool to receive the NFT
     * @param treasuryIndex Index of the treasury associated with this NFT
     * @param tokenURI Metadata URI for the NFT
     * @return The ID of the newly minted NFT
     */
    function mintToPool(address poolAddress, uint8 treasuryIndex, string memory tokenURI) external returns (uint256);
    
    /**
     * @notice Mints multiple NFTs and starts auctions for them
     * @param tokenURIs Array of metadata URIs for the NFTs
     * @param insuranceAddresses Array of insurance contract addresses to associate with each NFT
     */
    function mintAndAuctionNFTs(string[] memory tokenURIs, address[] memory insuranceAddresses) external;
    
    /**
     * @notice Places a bid in an active auction using GraviCha tokens
     * @param tokenId ID of the NFT being auctioned
     * @param bidAmount Amount of tokens to bid
     */
    function bid(uint256 tokenId, uint256 bidAmount) external;
    
    /**
     * @notice Allows outbid bidders to withdraw their refundable tokens
     */
    function withdraw() external;
    
    /**
     * @notice Allows the highest bidder to claim their NFT after auction ends
     * @param tokenId ID of the NFT to claim
     */
    function claimNFT(uint256 tokenId) external;
    
    /**
     * @notice Forcefully ends an auction after the duration has passed
     * @param tokenId ID of the NFT being auctioned
     */
    function forceEndAuction(uint256 tokenId) external;
    
    /**
     * @notice Updates the duration for all auctions
     * @param _auctionDuration New duration in seconds
     */
    function setAuctionDuration(uint256 _auctionDuration) external;
    
    /**
     * @notice Updates the token used for bidding
     * @param _token Address of the GraviCha token
     */
    function setToken(address _token) external;
    
    /**
     * @notice Burns excess tokens held by the contract
     * @param amount Amount of tokens to burn
     */
    function burnExcessTokens(uint256 amount) external;
    
    /**
     * @notice Burns an NFT in case of emergency
     * @param tokenId ID of the NFT to burn
     */
    function burn(uint256 tokenId) external;

    /**
     * @notice Returns a list of all NFTs that have been auctioned
     * @return Array of token IDs that have been auctioned
     */
    function getAuctionedNFTs() external returns (uint256[] memory);

    /**
     * @notice Returns detailed information about a specific auction
     * @param tokenId The ID of the NFT being auctioned
     * @return auctionedTokenId The ID of the NFT
     * @return highestBidder The address of the current highest bidder
     * @return highestBid The amount of the current highest bid
     * @return nftClaimed Whether the nft has been claimed
     * @return startTime The timestamp when the auction started
     */
    function getAuctionDetails(uint256 tokenId) external returns (
        uint256 auctionedTokenId,
        address highestBidder,
        uint256 highestBid,
        bool nftClaimed,
        uint256 startTime
    );

    /**
     * @notice Adds a new treasury address to the list of insurance pools
     * @param treasury Address of the insurance pool to add
     */
    function addTreasuryAddress(address treasury) external;
    
    /**
     * @notice Returns all treasury addresses
     * @return Array of treasury (insurance pool) addresses
     */
    function getTreasuryAddresses() external view returns (address[] memory);

    /**
     * @notice Returns the amount of tokens a bidder can withdraw
     * @return The amount of GraviCha tokens available for withdrawal
     */
    function withdrawableAmount() external view returns (uint256);
    
    /**
     * @notice Gets the treasury address for a specific token ID
     * @param tokenId The ID of the NFT
     * @return The address of the treasury (insurance pool)
     */
    function getTreasuryAddress(uint256 tokenId) external view returns (address);
    
    /**
     * @notice Updates an existing treasury address
     * @param index Index of the treasury to update
     * @param treasury New address for the treasury
     */
    function setTreasuryAddress(uint8 index, address treasury) external;
    
    /**
     * @notice Transfers an NFT with a custom donation amount to the treasury
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param tokenId ID of the NFT
     */
    function transferWithDonation(address from, address to, uint256 tokenId) external payable;

    /**
     * @notice Finds the index of a treasury given its address
     * @param treasuryAddress The treasury (insurance) address to search for
     * @return The index of the treasury in the treasuries array
     */
    function getTreasuryIndexByAddress(address treasuryAddress) external view returns (uint8);
}