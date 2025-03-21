// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// References: https://docs.openzeppelin.com/contracts/5.x/governance

interface IGraviCha {
    function mint(address to, uint256 amount) external;
}

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GraviGov is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable, Ownable {
    uint256 public constant MONTHLY_MINT = 10000 * 10 ** 18;
    uint256 public lastMintTimestamp;

    // Charity token exchange rate.
    uint256 public charityTokenExchangeRate = 1000; // 1 GGOV = 1000 CHARITY

    // The charity token used for minting.
    IGraviCha public charityToken;

    constructor(
        address _charityToken
    ) ERC20("GraviGov", "GGOV") ERC20Permit("GraviGov") Ownable(msg.sender) {
        lastMintTimestamp = block.timestamp;
        charityToken = IGraviCha(_charityToken);
    }

    // Now at any time a holder of the GraviGov token can burn it to receive charity tokens.
    function burnToCharityTokens(uint256 amount) external {
        _burn(msg.sender, amount);
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

    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
