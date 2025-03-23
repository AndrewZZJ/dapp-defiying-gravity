// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

interface IGraviCha is IERC20, IAccessControl {
    /// @notice Returns true if the account is an authorized minter.
    function minters(address account) external view returns (bool);

    /// @notice Adds an account as a minter. Can only be called by the owner.
    function addMinter(address account) external;

    /// @notice Removes an account as a minter. Can only be called by the owner.
    function removeMinter(address account) external;

    /// @notice Mints new tokens for rewarding charitable actions. Only authorized minters can call.
    function mint(address to, uint256 amount) external;
}