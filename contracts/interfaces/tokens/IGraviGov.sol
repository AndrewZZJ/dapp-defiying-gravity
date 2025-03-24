// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

interface IGraviGov is IERC20, IERC20Permit {
    /// @notice Converts GraviGov tokens to charity tokens.
    /// @param amount The amount of GraviGov tokens to convert.
    function convertToCharityTokens(uint256 amount) external;
    
    /// @notice Sets the charity token exchange rate.
    /// @param _charityTokenExchangeRate The new exchange rate.
    function setCharityTokenExchangeRate(uint256 _charityTokenExchangeRate) external;
    
    /// @notice Returns true if monthly minting is available.
    function monthlyMintAvailable() external view returns (bool);
    
    /// @notice Mint monthly tokens for the DAO.
    function mintMonthly() external;
    
    /// @notice Returns the current charity token exchange rate.
    function charityTokenExchangeRate() external view returns (uint256);
    
    /// @notice Returns the timestamp when the last mint occurred.
    function lastMintTimestamp() external view returns (uint256);
    
    /// @notice Returns the DAO address (the owner of GraviGov tokens).
    function dao() external view returns (address);
    
    /// @notice Returns the owner address.
    function owner() external view returns (address);

    /// @notice Mints new tokens for rewarding charitable actions. Only authorized minters can call.
    function mint(address to, uint256 amount) external;
}