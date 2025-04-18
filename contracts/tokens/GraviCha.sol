// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IGraviCha} from "../interfaces/tokens/IGraviCha.sol";

/**
 * @title GraviCha
 * @notice Charity token used for donations and rewards in the Gravi system
 * @dev Implements minter roles to allow controlled token issuance
 */
contract GraviCha is IGraviCha, ERC20, Ownable, AccessControl {
    // Mapping to track addresses authorized to mint tokens
    mapping(address => bool) public minters;

    /**
     * @notice Initializes the charity token
     */
    constructor() ERC20("GraviCha", "GCHA") Ownable(msg.sender) {}

    /**
     * @notice Ensures only authorized minters can mint tokens
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "GraviCha: Not authorized to mint");
        _;
    }

    /**
     * @notice Adds an address to the list of authorized minters
     * @param account Address to authorize for minting
     * @dev Only callable by the owner (DAO)
     */
    function addMinter(address account) external onlyOwner {
        minters[account] = true;
    }

    /**
     * @notice Removes an address from the list of authorized minters
     * @param account Address to remove minting authorization from
     * @dev Only callable by the owner (DAO)
     */
    function removeMinter(address account) external onlyOwner {
        minters[account] = false;
    }

    /**
     * @notice Mints new charity tokens to a specified address
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @dev Only callable by authorized minters
     */
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens from the caller's balance
     * @param value Amount of tokens to burn
     */
    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }

    /**
     * @notice Burns tokens from a target address (requires approval)
     * @param account Address to burn tokens from
     * @param value Amount of tokens to burn
     * @dev Caller must have allowance from the account
     */
    function burnFrom(address account, uint256 value) external {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }

    /**
     * @notice Burns tokens from a target address without approval
     * @param account Address to burn tokens from
     * @param value Amount of tokens to burn
     * @dev Only callable by the owner (DAO)
     */
    function burnFromByOwner(address account, uint256 value) external onlyOwner {
        _burn(account, value);
    }
}
