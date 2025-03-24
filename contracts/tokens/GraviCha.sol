// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract GraviCha is ERC20, Ownable, AccessControl {
    mapping(address => bool) public minters;

    constructor() ERC20("GraviCha", "GCHA") Ownable(msg.sender) {}

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

    /// @notice Burn a specific amount of tokens.
    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }

    /// @notice Burn a specific amount of tokens from the target address and decrement allowance.
    function burnFrom(address account, uint256 value) external {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }

    /// @notice Burn a specific amount of tokens from the target address, by owner (DAO).
    function burnFromByOwner(address account, uint256 value) external onlyOwner {
        _burn(account, value);
    }
}
