// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// References: https://docs.openzeppelin.com/contracts/5.x/governance
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces
import {IGraviGov} from "../interfaces/tokens/IGraviGov.sol";

/**
 * @title GraviGov
 * @notice Governance token for the GraviDAO system
 * @dev Extends ERC20Votes to enable on-chain governance
 */
contract GraviGov is ERC20, ERC20Permit, ERC20Votes, Ownable, IGraviGov {
    uint256 public monthlyMintAmount = 10000 ether; // Monthly mint amount in wei tokens
    uint256 public lastMintTimestamp;

    /**
     * @notice Initializes the governance token.
     */
    constructor(
    ) ERC20("GraviGov", "GGOV") ERC20Permit("GraviGov") Ownable(msg.sender) {
        lastMintTimestamp = block.timestamp;
    }

    /**
     * @notice Mints the monthly token allocation
     * @dev Only callable by the owner (DAO), tokens are minted to the DAO for distribution
     */
    function mintMonthly() external onlyOwner {
        _mint(owner(), monthlyMintAmount); // Mint to DAO for further distribution.
        lastMintTimestamp = block.timestamp;
    }

    /**
     * @notice Updates the monthly mint amount
     * @param _monthlyMintAmount New monthly mint amount in tokens
     * @dev Only callable by the owner (DAO)
     */
    function setMonthlyMintAmount(uint256 _monthlyMintAmount) external onlyOwner {
        monthlyMintAmount = _monthlyMintAmount;
    }

    /**
     * @notice Mints new governance tokens to a specified address
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @dev Only callable by the owner (DAO)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Hook that is called when tokens are moved
     * @dev Required override for ERC20Votes to track voting power
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    /**
     * @notice Gets the current nonce for an address
     * @dev Required override for compatibility with ERC20Permit and Nonces
     */
    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
