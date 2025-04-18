// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// Interface for the tokens and insurance functions
import {IGraviCha} from "../interfaces/tokens/IGraviCha.sol";
import {IGraviInsurance} from "../interfaces/IGraviInsurance.sol";
import {IGraviPoolNFT} from "../interfaces/tokens/IGraviPoolNFT.sol";

/**
 * @title GraviPoolNFT
 * @notice NFT contract that represents ownership in the insurance pools
 * @dev Uses auctions to distribute NFTs and collects fees for the insurance pools
 */
contract GraviPoolNFT is
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    IERC721Receiver,
    IGraviPoolNFT
{
    uint256 private _nextTokenId;
    uint256 public auctionDuration = 7 days; // Duration of each auction

    // Configurable fee for transfers (default: 0.00001 ETH)
    uint256 public transferFee = 0.00001 ether;

    // The ERC20 token used for bidding (and charity donation)
    IGraviCha public graviCha;

    // Maps token IDs to their associated treasury (insurance pool) index
    mapping(uint256 => uint8) public tokenTreasuryIndex;
    address[] public treasuries;

    // Tracking donations associated with each NFT
    mapping(uint256 => uint256) public tokenDonations;

    /**
     * @notice Auction data structure for NFT sales
     * @param tokenId ID of the NFT being auctioned
     * @param highestBidder Address of the current highest bidder
     * @param highestBid Amount of the current highest bid in GraviCha tokens
     * @param ended Whether the auction has been finalized
     * @param startTime Timestamp when the auction started
     */
    struct Auction {
        uint256 tokenId;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        uint256 startTime;
    }

    // Mapping of token ID to auction details
    mapping(uint256 => Auction) public auctions;

    // Mapping to hold refundable amounts for outbid bidders
    mapping(address => uint256) public pendingReturns;

    // Events
    event AuctionStarted(uint256 tokenId, uint256 startTime);
    event AuctionBid(uint256 tokenId, address bidder, uint256 bid);
    event AuctionEnded(uint256 tokenId, address winner, uint256 bid);

    /**
     * @notice Ensures auction is still active and not ended
     * @param tokenId The ID of the NFT token being auctioned
     */
    modifier auctionActive(uint256 tokenId) {
        Auction storage auction = auctions[tokenId];
        require(
            block.timestamp < auction.startTime + auctionDuration,
            "GraviPoolNFT: Auction has ended"
        );
        require(!auction.ended, "GraviPoolNFT: Auction already ended");
        _;
    }

    /**
     * @notice Ensures auction has ended but not been finalized
     * @param tokenId The ID of the NFT token being auctioned
     */
    modifier auctionEnded(uint256 tokenId) {
        Auction storage auction = auctions[tokenId];
        require(
            block.timestamp >= auction.startTime + auctionDuration,
            "GraviPoolNFT: Auction still active"
        );
        require(!auction.ended, "GraviPoolNFT: Auction already ended");
        _;
    }

    /**
     * @notice Ensures caller is either token owner or approved to manage token
     * @param tokenId The ID of the NFT token
     */
    modifier onlyTokenOwnerOrApproved(uint256 tokenId) {
        bool isOwner = ownerOf(tokenId) == msg.sender;
        bool isApproved = getApproved(tokenId) == msg.sender;
        require(
            isOwner || isApproved,
            "GraviPoolNFT: Not token owner or approved"
        );
        _;
    }

    /**
     * @notice Constructor initializes the contract with the GraviCha token address
     * @param _graviCha Address of the GraviCha token contract
     */
    constructor(
        address _graviCha
    ) ERC721("GraviPoolNFT", "GRANFT") Ownable(msg.sender) {
        graviCha = IGraviCha(_graviCha);
    }

    /**
     * @notice Updates the transfer fee
     * @param _transferFee New fee amount in wei
     * @dev Only callable by the owner (DAO)
     */
    function setTransferFee(uint256 _transferFee) external onlyOwner {
        transferFee = _transferFee;
    }

    /**
     * @notice Adds a new treasury address to the list of insurance pools
     * @param treasury Address of the insurance pool to add
     * @dev Only callable by the owner (DAO)
     */
    function addTreasuryAddress(address treasury) external onlyOwner {
        treasuries.push(treasury);
    }

    /**
     * @notice Returns all treasury addresses
     * @return Array of treasury (insurance pool) addresses
     */
    function getTreasuryAddresses() external view returns (address[] memory) {
        return treasuries;
    }

    /**
     * @notice Gets the treasury address for a specific token ID
     * @param tokenId The ID of the NFT
     * @return The address of the treasury (insurance pool)
     */
    function getTreasuryAddress(uint256 tokenId) external view returns (address) {
        // Get the treasury index for the token ID.
        uint8 index = tokenTreasuryIndex[tokenId];
        // Ensure the index is within bounds.
        require(index < treasuries.length, "GraviPoolNFT: Index out of bounds");
        // Return the treasury address at that index.
        return treasuries[index];
    }

    /**
     * @notice Updates an existing treasury address
     * @param index Index of the treasury to update
     * @param treasury New address for the treasury
     * @dev Only callable by the owner (DAO)
     */
    function setTreasuryAddress(uint8 index, address treasury) external onlyOwner {
        require(index < treasuries.length, "GraviPoolNFT: Index out of bounds");
        treasuries[index] = treasury;
    }

    /**
     * @notice Finds the index of a treasury given its address
     * @param treasuryAddress The treasury (insurance) address to search for
     * @return The index of the treasury in the treasuries array
     */
    function getTreasuryIndexByAddress(address treasuryAddress) external view returns (uint8) {
        return _getTreasuryIndexByAddress(treasuryAddress);
    }

    /**
     * @notice Internal function to find the index of a treasury
     * @param treasuryAddress The treasury address to search for
     * @return The index of the treasury in the treasuries array
     */
    function _getTreasuryIndexByAddress(address treasuryAddress) internal view returns (uint8) {
        for (uint8 i = 0; i < treasuries.length; i++) {
            if (treasuries[i] == treasuryAddress) {
                return i;
            }
        }
        revert("GraviPoolNFT: Treasury address not found");
    }

    /**
     * @notice Transfers an NFT with a fixed fee that goes to the NFT's treasury
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param tokenId ID of the NFT
     * @dev Requires msg.value >= transferFee
     */
    function transferWithFee(
        address from,
        address to,
        uint256 tokenId
    ) external payable onlyTokenOwnerOrApproved(tokenId) nonReentrant {
        require(msg.value >= transferFee, "GraviPoolNFT: Insufficient fee");
        address treasury = treasuries[tokenTreasuryIndex[tokenId]];
        require(treasury != address(0), "GraviPoolNFT: Treasury not set");
        (bool sent, ) = payable(treasury).call{value: msg.value}("");
        require(sent, "GraviPoolNFT: Fee transfer failed");
        safeTransferFrom(from, to, tokenId);
    }

    /**
     * @notice Transfers an NFT with a custom donation amount to the treasury
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param tokenId ID of the NFT
     * @dev The entire msg.value is sent as a donation to the treasury
     */
    function transferWithDonation(
        address from,
        address to,
        uint256 tokenId
    ) external payable onlyTokenOwnerOrApproved(tokenId) nonReentrant {
        require(msg.value > 0, "GraviPoolNFT: Donation amount must be > 0");
        address treasury = treasuries[tokenTreasuryIndex[tokenId]];
        require(treasury != address(0), "GraviPoolNFT: Treasury not set");
        (bool sent, ) = payable(treasury).call{value: msg.value}("");
        require(sent, "GraviPoolNFT: Donation transfer failed");
        safeTransferFrom(from, to, tokenId);
    }

    /**
     * @notice Internal function to mint a new NFT
     * @param to Address to mint the NFT to
     * @param tokenURI Metadata URI for the NFT
     * @param treasuryIndex Index of the treasury in the treasuries array
     * @return The ID of the newly minted NFT
     */
    function _mintNFT(
        address to,
        string memory tokenURI,
        uint8 treasuryIndex
    ) internal onlyOwner returns (uint256) {
        require(treasuryIndex < treasuries.length, "GraviPoolNFT: Invalid treasury index");
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenTreasuryIndex[tokenId] = treasuryIndex;
        return tokenId;
    }

    /**
     * @notice Mints a new NFT directly to an insurance pool
     * @param poolAddress Address of the insurance pool to receive the NFT
     * @param treasuryIndex Index of the treasury to associate with the NFT
     * @param tokenURI Metadata URI for the NFT
     * @return The ID of the newly minted NFT
     * @dev Only callable by the owner (DAO)
     */
    function mintToPool(
        address poolAddress,
        uint8 treasuryIndex,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        return _mintNFT(poolAddress, tokenURI, treasuryIndex);
    }

    /**
     * @notice Internal function to start an auction for a newly minted NFT
     * @param tokenURI Metadata URI for the NFT
     * @param treasuryIndex Index of the treasury to associate with the NFT
     * @return The ID of the newly minted NFT that is being auctioned
     */
    function startAuction(
        string memory tokenURI,
        uint8 treasuryIndex
    ) internal onlyOwner returns (uint256) {
        uint256 tokenId = _mintNFT(address(this), tokenURI, treasuryIndex);
        auctions[tokenId] = Auction({
            tokenId: tokenId,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            startTime: block.timestamp
        });
        emit AuctionStarted(tokenId, block.timestamp);
        return tokenId;
    }

    /**
     * @notice Returns a list of all NFTs that have been auctioned
     * @return Array of token IDs that have been auctioned
     */
    function getAuctionedNFTs() external view returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](_nextTokenId);
        uint256 count = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (auctions[i].startTime > 0) {
                tokenIds[count] = i;
                count++;
            }
        }
        return tokenIds;
    }

    /**
     * @notice Returns detailed information about a specific auction
     * @param tokenId The ID of the NFT being auctioned
     * @return auctionedTokenId The ID of the NFT
     * @return highestBidder The address of the current highest bidder
     * @return highestBid The amount of the current highest bid
     * @return ended Whether the auction has been finalized
     * @return startTime The timestamp when the auction started
     */
    function getAuctionDetails(
        uint256 tokenId
    ) external view returns (
        uint256 auctionedTokenId,
        address highestBidder,
        uint256 highestBid,
        bool ended,
        uint256 startTime
    ) {
        Auction memory auction = auctions[tokenId];
        return (auction.tokenId, auction.highestBidder, auction.highestBid, auction.ended, auction.startTime);
    }
    
    /**
     * @notice Mints and starts auctions for multiple NFTs
     * @param tokenURIs Array of metadata URIs for the NFTs
     * @param insuranceAddresses Array of insurance contract addresses to associate with each NFT
     * @dev Only callable by the owner (DAO)
     */
    function mintAndAuctionNFTs(
        string[] memory tokenURIs,
        address[] memory insuranceAddresses
    ) external onlyOwner {
        require(tokenURIs.length == insuranceAddresses.length, "GraviPoolNFT: Arrays length mismatch");
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            // Retrieve the treasury index from the insurance contract instance.
            uint8 treasuryIndex = _getTreasuryIndexByAddress(insuranceAddresses[i]);
            startAuction(tokenURIs[i], treasuryIndex);
        }
    }

    /**
     * @notice Places a bid on an active auction
     * @param tokenId The ID of the NFT being auctioned
     * @param bidAmount The amount of GraviCha tokens to bid
     * @dev Requires approval for GraviCha tokens before calling
     */
    function bid(
        uint256 tokenId,
        uint256 bidAmount
    ) external auctionActive(tokenId) nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(bidAmount > auction.highestBid, "GraviPoolNFT: Bid too low");

        // Transfer ERC20 tokens from bidder to this contract (escrow).
        graviCha.transferFrom(msg.sender, address(this), bidAmount);

        // Refund the previous highest bidder using a pull pattern.
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        // Update the auction with the new highest bid.
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        emit AuctionBid(tokenId, msg.sender, bidAmount);
    }

    /**
     * @notice Allows outbid bidders to withdraw their refundable tokens
     * @dev Uses pull pattern for security
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "GraviPoolNFT: No funds to withdraw");
        pendingReturns[msg.sender] = 0;
        graviCha.transfer(msg.sender, amount);
    }

    /**
     * @notice Returns the amount of tokens a bidder can withdraw
     * @return The amount of GraviCha tokens available for withdrawal
     */
    function withdrawableAmount() external view returns (uint256) {
        return pendingReturns[msg.sender];
    }

    /**
     * @notice Allows the highest bidder to claim their NFT after auction ends
     * @param tokenId The ID of the NFT being claimed
     * @dev The winning bid tokens are burned as a charity donation
     */
    function claimNFT(
        uint256 tokenId
    ) external auctionEnded(tokenId) nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(
            msg.sender == auction.highestBidder,
            "GraviPoolNFT: Not highest bidder"
        );

        auction.ended = true;

        // Transfer NFT from contract to highest bidder.
        _transfer(address(this), auction.highestBidder, tokenId);

        // Record the donation amount.
        tokenDonations[tokenId] = auction.highestBid;

        // Burn tokens corresponding to the winning bid.
        graviCha.burn(auction.highestBid);

        emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
    }

    /**
     * @notice Forces an auction to end after duration has passed
     * @param tokenId The ID of the NFT being auctioned
     * @dev Only callable by the owner (DAO)
     */
    function forceEndAuction(
        uint256 tokenId
    ) external onlyOwner auctionEnded(tokenId) nonReentrant {
        Auction storage auction = auctions[tokenId];
        auction.ended = true;
        if (auction.highestBidder != address(0)) {
            // Transfer NFT from contract to highest bidder.
            _transfer(address(this), auction.highestBidder, tokenId);

            // Transfer winning bid tokens are burned.
            graviCha.burn(auction.highestBid);

            // Record the donation amount.
            tokenDonations[tokenId] = auction.highestBid;

            emit AuctionEnded(
                tokenId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // If no bids were placed, burn the NFT.
            _burn(tokenId);
            emit AuctionEnded(tokenId, address(0), 0);
        }
    }

    /**
     * @notice Updates the duration for auctions
     * @param _auctionDuration New duration in seconds
     * @dev Only callable by the owner (DAO)
     */
    function setAuctionDuration(uint256 _auctionDuration) external onlyOwner {
        auctionDuration = _auctionDuration;
    }

    /**
     * @notice Updates the GraviCha token address
     * @param _token New token address
     * @dev Only callable by the owner (DAO)
     */
    function setToken(address _token) external onlyOwner {
        graviCha = IGraviCha(_token);
    }

    /**
     * @notice Burns excess tokens held by the contract
     * @param amount Amount of tokens to burn
     * @dev Only callable by the owner (DAO)
     */
    function burnExcessTokens(uint256 amount) external onlyOwner {
        graviCha.burn(amount);
    }

    /**
     * @notice Burns an NFT in case of emergency
     * @param tokenId The ID of the NFT to burn
     * @dev Only callable by the owner (DAO)
     */
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    /**
     * @notice Implements IERC721Receiver to allow the contract to receive NFTs
     * @return IERC721Receiver selector
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
