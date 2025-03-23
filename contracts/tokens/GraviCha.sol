// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract GraviCha is ERC20, Ownable, ERC20Burnable, AccessControl {
    mapping(address => bool) public minters;

    constructor() ERC20("GraviCha", "GCHA") Ownable(msg.sender) {
        // Owner is automatically added as a minter.
        minters[msg.sender] = true;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "GraviCha: Not authorized to mint");
        _;
    }

    /// @notice Owner can add authorized minters (such as DAO or insurance modules).
    function addMinter(address account) external onlyOwner {
        minters[account] = true;
    }

    function removeMinter(address account) external onlyOwner {
        minters[account] = false;
    }

    /// @notice Mint new tokens for rewarding charitable actions.
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
