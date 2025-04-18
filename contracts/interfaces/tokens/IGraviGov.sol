// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title IGraviGov
 * @notice Interface for the GraviGov governance token that extends ERC20 and voting capabilities
 * @dev This token enables holders to vote on governance proposals and convert tokens to charity tokens
 */
interface IGraviGov is IERC20, IVotes {
    /**
     * @notice Converts GraviGov tokens to charity tokens
     * @param amount The amount of GraviGov tokens to convert
     */
    function convertToCharityTokens(uint256 amount) external;
    
    /**
     * @notice Sets the charity token exchange rate
     * @param _charityTokenExchangeRate The new exchange rate
     * @dev Only callable by the owner or governance
     */
    function setCharityTokenExchangeRate(uint256 _charityTokenExchangeRate) external;

    /**
     * @notice Returns the monthly mint amount
     * @return The amount of tokens that can be minted monthly
     */
    function monthlyMintAmount() external view returns (uint256);

    /**
     * @notice Sets the monthly mint amount
     * @param _monthlyMintAmount The new monthly mint amount
     * @dev Only callable by the owner or governance
     */
    function setMonthlyMintAmount(uint256 _monthlyMintAmount) external;
    
    /**
     * @notice Mint monthly tokens for the DAO
     * @dev Only callable by the owner or governance
     */
    function mintMonthly() external;
    
    /**
     * @notice Returns the current charity token exchange rate
     * @return The current exchange rate
     */
    function charityTokenExchangeRate() external view returns (uint256);
    
    /**
     * @notice Get the charity exchange rate
     * @return The current charity token exchange rate
     */
    function getCharityTokenExchangeRate() external view returns (uint256);

    /**
     * @notice Returns the timestamp when the last mint occurred
     * @return The timestamp of the last mint operation
     */
    function lastMintTimestamp() external view returns (uint256);
    
    /**
     * @notice Mints new tokens for rewarding charitable actions
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @dev Only authorized minters can call this function
     */
    function mint(address to, uint256 amount) external;
}