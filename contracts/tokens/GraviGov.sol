// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// References: https://docs.openzeppelin.com/contracts/5.x/governance
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces
import {IGraviCha} from "../interfaces/tokens/IGraviCha.sol";
import {IGraviDAO} from "../interfaces/IGraviDAO.sol";

contract GraviGov is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable, Ownable {
    uint256 public constant MONTHLY_MINT = 10000 * 10 ** 18;
    uint256 public lastMintTimestamp;

    // Charity token exchange rate. Can be updated by the owner.
    uint256 public charityTokenExchangeRate = 1000; // 1 GGOV = 1000 CHARITY

    // The charity token used for minting.
    IGraviCha public charityToken;

    // The dao address is the owner of the GraviGov token.
    IGraviDAO public dao;

    constructor(
        address _charityToken
    ) ERC20("GraviGov", "GGOV") ERC20Permit("GraviGov") Ownable(msg.sender) {
        lastMintTimestamp = block.timestamp;
        charityToken = IGraviCha(_charityToken);
    }

    function setDAO(address _dao) external onlyOwner {
        dao = IGraviDAO(_dao);
    }

    // Now at any time a holder of the GraviGov token can convert tokens
    // to charity token by putting it back to the dao token pool
    function convertToCharityTokens(uint256 amount) external {
        // Check if the caller has enough tokens
        require(balanceOf(msg.sender) >= amount, "GraviGov: Not enough tokens");

        // Simply transfer the tokens to the DAO
        transfer(address(dao), amount);

        charityToken.mint(msg.sender, amount * charityTokenExchangeRate);
    }

    function setCharityTokenExchangeRate(uint256 _charityTokenExchangeRate) external onlyOwner {
        charityTokenExchangeRate = _charityTokenExchangeRate;
    }
    
    function monthlyMintAvailable() public view returns (bool) {
        return block.timestamp >= lastMintTimestamp + 30 days;
    }

    function mintMonthly() external onlyOwner {
        _mint(owner(), MONTHLY_MINT); // Mint to DAO for further distribution.
        lastMintTimestamp = block.timestamp;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
