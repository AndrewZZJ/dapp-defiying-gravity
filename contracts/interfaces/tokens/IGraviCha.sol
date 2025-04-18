// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IGraviCha
 * @notice Interface for the GraviCha charity token that extends ERC20 with minting and burning capabilities
 * @dev This token uses AccessControl for managing minters
 */
interface IGraviCha is IERC20, IAccessControl {
    /**
     * @notice Returns true if the account is an authorized minter
     * @param account The address to check
     * @return True if the account is a minter, false otherwise
     */
    function minters(address account) external view returns (bool);

    /**
     * @notice Adds an account as a minter
     * @param account The address to add as a minter
     * @dev Can only be called by the owner
     */
    function addMinter(address account) external;

    /**
     * @notice Removes an account as a minter
     * @param account The address to remove as a minter
     * @dev Can only be called by the owner
     */
    function removeMinter(address account) external;

    /**
     * @notice Mints new tokens for rewarding charitable actions
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @dev Only authorized minters can call this function
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burns a specific amount of tokens
     * @param value The amount of tokens to burn
     * @dev Tokens are deducted from the caller's balance
     */
    function burn(uint256 value) external;
    
    /**
     * @notice Burns a specific amount of tokens from the target address
     * @param account The account to burn tokens from
     * @param value The amount of tokens to burn
     * @dev Decrements allowance and requires prior approval
     */
    function burnFrom(address account, uint256 value) external;

    /**
     * @notice Burns a specific amount of tokens from the target address by owner
     * @param account The account to burn tokens from
     * @param value The amount of tokens to burn
     * @dev Can only be called by the owner (DAO), bypasses allowance checks
     */
    function burnFromByOwner(address account, uint256 value) external;
}