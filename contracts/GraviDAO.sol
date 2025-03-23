// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// OpenZeppelin Contracts
// References: https://docs.openzeppelin.com/contracts/5.x/governance
import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

// Contracts
// import {GraviInsurance} from "./GraviInsurance.sol";

// Interfaces
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviGov} from "./interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

// No proxy contract: GraviDAO is not upgradeable
// import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// The GraviDAO contract is the governance contract for the GraviCha ecosystem.
contract GraviDAO is Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Class variables
    mapping(string => IGraviInsurance) public insurancePools;

    IGraviCha public graviCha;
    IGraviPoolNFT public graviPoolNFT;

    // Events
    event PoolCreated(string disasterType, address poolAddress);

    // Constructor
    constructor(
        address _graviCha, 
        address _graviPoolNFT,
        IVotes _token,
        TimelockController _timelock
    ) Governor("GraviDAO") GovernorVotes(_token) GovernorVotesQuorumFraction(4) GovernorTimelockControl(_timelock) {
        graviCha = IGraviCha(_graviCha);
        graviPoolNFT = IGraviPoolNFT(_graviPoolNFT);
    }

    // Note: This insurance should already be deployed and verified on the blockchain
    // This simply adds the insurance pool to the DAO
    function addInsurancePool(string memory insuranceName, address insurancePool) external onlyGovernance {
        require(insurancePools[insuranceName] != IGraviInsurance(address(0)), "Pool already exists");

        // IGraviInsurance
        insurancePools[insuranceName] = IGraviInsurance(insurancePool);
        emit PoolCreated(insuranceName, insurancePool);
    }

    function getPoolAddress(string memory disasterType) external view returns (address) {
        return address(insurancePools[disasterType]);
    }

    /// Below are the governance functions that are required by the interfaces. /// 
    function votingDelay() public pure override returns (uint256) {
        return 7200; // 1 day
    }

    function votingPeriod() public pure override returns (uint256) {
        return 50400; // 1 week
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    // The functions below are overrides required by Solidity.
    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view virtual override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}