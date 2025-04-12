// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// Interface for the GraviCha token.
import {IGraviCha} from "../interfaces/tokens/IGraviCha.sol";
import {IGraviInsurance} from "../interfaces/IGraviInsurance.sol";
import {IGraviPoolNFT} from "../interfaces/tokens/IGraviPoolNFT.sol";

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

    // This should be the insurance pool contract address.
    // We'll maintain an array of treasury addresses (e.g., four insurance pools).
    mapping(uint256 => uint8) public tokenTreasuryIndex;
    address[] public treasuries;

    // Tracking donations associated with each NFT.
    mapping(uint256 => uint256) public tokenDonations;

    // Auction structure.
    struct Auction {
        uint256 tokenId;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        uint256 startTime;
    }

    // Mapping of token ID to auction details.
    mapping(uint256 => Auction) public auctions;

    // Mapping to hold refundable amounts for outbid bidders.
    mapping(address => uint256) public pendingReturns;

    // Events.
    event AuctionStarted(uint256 tokenId, uint256 startTime);
    event AuctionBid(uint256 tokenId, address bidder, uint256 bid);
    event AuctionEnded(uint256 tokenId, address winner, uint256 bid);

    // Modifier for functions that require the auction to be active (i.e. before duration ends).
    modifier auctionActive(uint256 tokenId) {
        Auction storage auction = auctions[tokenId];
        require(
            block.timestamp < auction.startTime + auctionDuration,
            "GraviPoolNFT: Auction has ended"
        );
        require(!auction.ended, "GraviPoolNFT: Auction already ended");
        _;
    }

    // Modifier for functions that require the auction to have ended (i.e. after duration).
    modifier auctionEnded(uint256 tokenId) {
        Auction storage auction = auctions[tokenId];
        require(
            block.timestamp >= auction.startTime + auctionDuration,
            "GraviPoolNFT: Auction still active"
        );
        require(!auction.ended, "GraviPoolNFT: Auction already ended");
        _;
    }

    // Modifier to check token ownership or approval.
    modifier onlyTokenOwnerOrApproved(uint256 tokenId) {
        bool isOwner = ownerOf(tokenId) == msg.sender;
        bool isApproved = getApproved(tokenId) == msg.sender;
        require(
            isOwner || isApproved,
            "GraviPoolNFT: Not token owner or approved"
        );
        _;
    }

    // Constructor with token addresses.
    constructor(
        address _graviCha
    ) ERC721("GraviPoolNFT", "GRANFT") Ownable(msg.sender) {
        graviCha = IGraviCha(_graviCha);
    }

    /// @notice Allows the owner to update the transfer fee.
    function setTransferFee(uint256 _transferFee) external onlyOwner {
        transferFee = _transferFee;
    }

    /// @notice Allows the owner to add a new treasury address.
    function addTreasuryAddress(address treasury) external onlyOwner {
        treasuries.push(treasury);
    }

    // View function to get the list of treasury addresses.
    function getTreasuryAddresses() external view returns (address[] memory) {
        return treasuries;
    }

    // View function to get the treasury address at a specific index.
    function getTreasuryAddress(uint256 tokenId) external view returns (address) {
        // Get the treasury index for the token ID.
        uint8 index = tokenTreasuryIndex[tokenId];
        // Ensure the index is within bounds.
        require(index < treasuries.length, "GraviPoolNFT: Index out of bounds");
        // Return the treasury address at that index.
        return treasuries[index];
    }

    /// @notice Allows the owner to update an existing treasury address.
    function setTreasuryAddress(uint8 index, address treasury) external onlyOwner {
        require(index < treasuries.length, "GraviPoolNFT: Index out of bounds");
        treasuries[index] = treasury;
    }

    /// @notice Returns the index of a treasury given its address.
    /// @param treasuryAddress The treasury (insurance) address to search for.
    /// @return The index of the treasury.
    function getTreasuryIndexByAddress(address treasuryAddress) external view returns (uint8) {
        return _getTreasuryIndexByAddress(treasuryAddress);
    }

    function _getTreasuryIndexByAddress(address treasuryAddress) internal view returns (uint8) {
        for (uint8 i = 0; i < treasuries.length; i++) {
            if (treasuries[i] == treasuryAddress) {
                return i;
            }
        }
        revert("GraviPoolNFT: Treasury address not found");
    }

    /// @notice A custom transfer function that collects a fixed fee to the NFT's treasury.
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

    /// @notice A new transfer function that allows a custom donation amount to be sent to the treasury.
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

    /// @notice Internal function used to mint a new NFT with a tokenURI and treasury index.
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


    /// @notice Mints a new NFT to an insurance pool along with its treasury index.
    function mintToPool(
        address poolAddress,
        uint8 treasuryIndex,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        return _mintNFT(poolAddress, tokenURI, treasuryIndex);
    }

    /// @notice Starts an auction for a newly minted NFT with its treasury index.
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

    /// @notice Get auctioned NFT lists
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

    /// @notice Get auction details for a specific NFT.
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
    
    // /// @notice Allows the DAO to mint and auction a list of new NFTs.
    // /// @dev Expects matching arrays of token URIs and treasury indices.
    // function mintAndAuctionNFTs(
    //     string[] memory tokenURIs,
    //     uint8[] memory treasuryIndices
    // ) external onlyOwner {
    //     require(tokenURIs.length == treasuryIndices.length, "GraviPoolNFT: Arrays length mismatch");
    //     for (uint256 i = 0; i < tokenURIs.length; i++) {
    //         startAuction(tokenURIs[i], treasuryIndices[i]);
    //     }
    // }
    /// @notice Allows the DAO to mint and auction a list of new NFTs.
    /// @dev Expects matching arrays of token URIs and insurance contract addresses.
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

    /// @notice Place a bid for an NFT auction using ERC20 tokens.
    /// The bidder must have approved this contract to spend at least `bidAmount` tokens.
    /// Tokens are held in escrow. If outbid, tokens can be withdrawn via `withdraw()`.
    function bid(
        uint256 tokenId,
        uint256 bidAmount
    ) external auctionActive(tokenId) nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(bidAmount > auction.highestBid, "GraviPoolNFT: Bid too low");

        // Transfer ERC20 tokens from bidder to this contract (escrow).
        graviCha.transferFrom(msg.sender, address(this), bidAmount);
        // graviCha.safeTransferFrom(msg.sender, address(this), bidAmount);

        // Refund the previous highest bidder using a pull pattern.
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        // Update the auction with the new highest bid.
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        emit AuctionBid(tokenId, msg.sender, bidAmount);
    }

    /// @notice Allows outbid bidders to withdraw their refundable tokens.
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "GraviPoolNFT: No funds to withdraw");
        pendingReturns[msg.sender] = 0;
        graviCha.transfer(msg.sender, amount);
    }

    /// @notice Function to see how much a bidder can withdraw.
    function withdrawableAmount() external view returns (uint256) {
        return pendingReturns[msg.sender];
    }

    /// @notice Highest bidder claims the NFT after the auction ends.
    /// The winning bid tokens are burned (as the charity donation).
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

    /// @notice Ends the auction forcibly and assigns the NFT to the highest bidder.
    /// The winning bid tokens are burned.
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

    /// @notice Allows the owner to update the auction duration.
    function setAuctionDuration(uint256 _auctionDuration) external onlyOwner {
        auctionDuration = _auctionDuration;
    }

    /// @notice Allows the owner to update the token address.
    function setToken(address _token) external onlyOwner {
        graviCha = IGraviCha(_token);
    }

    /// @notice Allows the owner to burn excess tokens sent to the contract.
    function burnExcessTokens(uint256 amount) external onlyOwner {
        graviCha.burn(amount);
    }

    /// @notice Allows the owner to burn NFTs in case of emergency.
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    /// @notice ERC721 hook to check if the token is accepted.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
