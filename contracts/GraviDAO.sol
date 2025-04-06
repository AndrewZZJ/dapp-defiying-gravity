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
import {IERC6372} from "@openzeppelin/contracts/interfaces/IERC6372.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

// Interfaces
import {IGraviDAO} from "./interfaces/IGraviDAO.sol";
import {IGraviInsurance} from "./interfaces/IGraviInsurance.sol";
import {IGraviGov} from "./interfaces/tokens/IGraviGov.sol";
import {IGraviCha} from "./interfaces/tokens/IGraviCha.sol";
import {IGraviPoolNFT} from "./interfaces/tokens/IGraviPoolNFT.sol";

// No proxy contract: GraviDAO is not upgradeable
// import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// The GraviDAO contract is the governance contract for the GraviCha ecosystem.
contract GraviDAO is
    IGraviDAO,
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // ---------------------------------------------------
    // State variables - The tokens and pools managed by GraviDAO
    // ---------------------------------------------------
    IGraviCha public graviCha;
    IGraviGov public graviGov;

    // ---------------------------------------------------
    // State variables for GraviGov token management
    // ---------------------------------------------------
    uint256 public govTokenEthPrice = 100 wei; // Price (in wei) per Gov token
    uint256 public govTokenGraviChaBurn = 1; // Amount of GraviCha tokens to burn per Gov token

    // // ---------------------------------------------------
    // // Staking for GraviGov tokens
    // // ---------------------------------------------------
    // mapping(address => uint256) public stakedGov;
    // mapping(address => uint256) public stakingRewardBalance;
    // mapping(address => uint256) public lastRewardUpdate;
    // uint256 public stakingRewardRate; // Reward rate (GraviChar per second per staked Gov token)

    // ---------------------------------------------------
    // State variables for Insurance and NFT pool
    // ---------------------------------------------------
    mapping(string => IGraviInsurance) public insurancePools;
    // mapping(string => address) public nftPools;
    IGraviPoolNFT public nftPool;
    string[] public insurancePoolNames;
    // address[] public nftPoolList;

    // ---------------------------------------------------
    // Initial Deployment permissions and parameters
    // ---------------------------------------------------
    address public immutable initialDeployer;
    bool public setupComplete;

    modifier onlyGovernanceOrInitialDeployer() {
        // Allow the deployer to execute setup commands until the setup is complete.
        if (msg.sender == initialDeployer && !setupComplete) {
            _;
        } else {
            // Call the standard governance check.
            _checkGovernance();
            _;
        }
    }

    // // ---------------------------------------------------
    // // Voting reward: Award GraviChar when a vote is cast
    // // ---------------------------------------------------
    // mapping(uint256 => mapping(address => bool)) public voteRewarded;
    // uint256 public voteRewardAmount = 1; // Amount of GraviChar awarded per vote

    // ---------------------------------------------------
    // State variables for voting and governance
    // ---------------------------------------------------
    // Note: This is in blocks, not seconds
    uint256 public govVotingDelay = 7200; // 1 day
    uint256 public govVotingPeriod = 50400; // 1 week
    uint256 public govProposalThreshold = 0;

    // ---------------------------------------------------
    // Events - Emitted for important contract actions
    // ---------------------------------------------------
    event InsuranceCreated(string disasterType, address poolAddress);
    event InsuranceRemoved(string disasterType, address poolAddress);
    event NFTPoolAdded(address poolAddress);
    event NFTPoolRemoved(address poolAddress);
    event GovTokensPurchased(address indexed buyer, uint256 amount);

    // event GovTokensDonated(address indexed donor, uint256 amount);
    // event Staked(address indexed staker, uint256 amount);
    // event Unstaked(address indexed staker, uint256 amount);
    // event StakingRewardClaimed(address indexed staker, uint256 reward);

    // ---------------------------------------------------
    // Constructor
    // ---------------------------------------------------
    constructor(
        address _graviCha,
        address _graviGov,
        IVotes _token,
        TimelockController _timelock
    )
        Governor("GraviDAO")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {
        // Ensure the governance token (used by GovernorVotes) is the GraviGov token.
        require(
            address(_token) == _graviGov,
            "GraviGov token must be used for governance"
        );

        // Set the GraviCha and GraviGov contracts
        graviCha = IGraviCha(_graviCha);
        graviGov = IGraviGov(_graviGov);

        // Initial setup - Permissions and parameters
        initialDeployer = msg.sender;
        setupComplete = false;
    }

    // ---------------------------------------------------
    // Initial setup functions
    // ---------------------------------------------------
    function setFinishedInitialSetup()
        external
        onlyGovernanceOrInitialDeployer
    {
        setupComplete = true;
    }

    // // To Enable TimeStamp based clock instead of block based (default)
    // function clock() public view override(Governor, GovernorVotes) returns (uint48) {
    //     return SafeCast.toUint48(block.timestamp);
    // }

    // function CLOCK_MODE() public pure override(Governor, GovernorVotes) returns (string memory) {
    //     return "mode=timestamp";
    // }

    // Override clock() to resolve conflict.
    function clock()
        public
        view
        override(Governor, GovernorVotes, IERC6372)
        returns (uint48)
    {
        return super.clock();
    }

    // Override CLOCK_MODE() to resolve conflict.
    function CLOCK_MODE()
        public
        view
        override(Governor, GovernorVotes, IERC6372)
        returns (string memory)
    {
        return super.CLOCK_MODE();
    }

    // Override quorum() to resolve conflict.
    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(Governor, GovernorVotesQuorumFraction, IGovernor)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    // ---------------------------------------------------
    // 1. GraviGov Token Minting and Purchase Pool
    // ---------------------------------------------------
    function setGovernanceTokenParameters(
        uint256 newRate,
        uint256 newPrice,
        uint256 newBurnAmount,
        uint256 mintAmount
    ) external onlyGovernanceOrInitialDeployer {
        govTokenEthPrice = newPrice;
        govTokenGraviChaBurn = newBurnAmount;
        graviGov.setCharityTokenExchangeRate(newRate);
        graviGov.setMonthlyMintAmount(mintAmount);
    }

    function monthlyMintGovTokens() external onlyGovernanceOrInitialDeployer {
        graviGov.mintMonthly();
    }

    function setMonthlyGovMintAmount(
        uint256 newAmount
    ) external onlyGovernance {
        graviGov.setMonthlyMintAmount(newAmount);
    }

    function setCharityTokenExchangeRate(
        uint256 newRate
    ) external onlyGovernance {
        graviGov.setCharityTokenExchangeRate(newRate);
    }

    // // Setters for GraviGov token purchase parameters and monthly minting
    // function setGovTokenEthPrice(uint256 newPrice) external onlyGovernance {
    //     govTokenEthPrice = newPrice;
    // }

    // function setGovTokenGraviChaBurn(uint256 newBurnAmount) external onlyGovernance {
    //     govTokenGraviChaBurn = newBurnAmount;
    // }

    function purchaseGovTokens(uint256 amount) external payable {
        uint256 requiredEth = amount * govTokenEthPrice;
        require(msg.value >= requiredEth, "Insufficient Ether sent");
        require(
            graviGov.balanceOf(address(this)) >= amount,
            "Not enough governance tokens in pool"
        );

        // Check that the caller has enough charity tokens for burning.
        uint256 requiredCharityTokens = amount * govTokenGraviChaBurn;
        require(
            graviCha.balanceOf(msg.sender) >= requiredCharityTokens,
            "Insufficient charity tokens"
        );

        // Burn the required GraviCha tokens from the sender.
        graviCha.burnFrom(msg.sender, requiredCharityTokens);

        // Transfer GraviGov tokens from the DAO pool (this contract) to the buyer.
        require(
            graviGov.transfer(msg.sender, amount),
            "Gov token transfer failed"
        );

        // Refund any excess Ether.
        uint256 excess = msg.value - requiredEth;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        emit GovTokensPurchased(msg.sender, amount);
    }

    // // Get the token purchase price per governance token, in ETH and GraviCha
    // function getGovTokenPurchasePrice() external view returns (uint256 ethPrice, uint256 graviChaBurn) {
    //     return (govTokenEthPrice, govTokenGraviChaBurn);
    // }

    // Calculates the token purchase price per given governance tokens, in ETH and GraviCha
    function calculatesGovTokenPurchasePrice(
        uint256 amount
    ) external view returns (uint256 ethPrice, uint256 graviChaBurn) {
        return (amount * govTokenEthPrice, amount * govTokenGraviChaBurn);
    }

    function getGovTokenPoolBalance() external view returns (uint256) {
        return graviGov.balanceOf(address(this));
    }

    // // Setters for GraviGov token purchase parameters and monthly minting
    // function setGovTokenEthPrice(uint256 newPrice) external onlyGovernance {
    //     govTokenEthPrice = newPrice;
    // }

    // function setGovTokenGraviChaBurn(uint256 newBurnAmount) external onlyGovernance {
    //     govTokenGraviChaBurn = newBurnAmount;
    // }

    // ---------------------------------------------------
    // 2. Insurance Pool management, NFT Pool Management and Monthly Minting
    // ---------------------------------------------------
    function setNFTPool(
        address _nftPool
    ) external onlyGovernanceOrInitialDeployer {
        require(
            address(_nftPool) != address(0),
            "NFT pool address cannot be zero"
        );

        require(
            Ownable(_nftPool).owner() == address(this),
            "DAO must own NFT pool"
        );

        IGraviPoolNFT newNftPool = IGraviPoolNFT(_nftPool);

        // Check if an existing NFT pool is already set
        if (address(nftPool) != address(0)) {
            // Revoke minter role for GraviCha from the old NFT pool
            graviCha.removeMinter(address(nftPool));

            // Emit event for NFT pool removal
            emit NFTPoolRemoved(address(nftPool));
        }

        // Add the new NFT pool to the list
        nftPool = newNftPool;

        // Automatically grant minter role for GraviCha to the NFT pool
        graviCha.addMinter(_nftPool);

        // Emit event for NFT pool addition
        emit NFTPoolAdded(_nftPool);
    }

    function addInsurancePool(
        string memory poolName,
        address insurancePool
    ) external onlyGovernanceOrInitialDeployer {
        require(
            address(insurancePools[poolName]) == address(0),
            "Insurance pool already exists"
        );

        // Check NFT pool exists
        require(
            address(nftPool) != address(0),
            "NFT pool must be set before adding insurance pool"
        );

        // require(nftPools[poolName] == address(0), "NFT pool already exists");

        // Check DAO ownership of both contracts
        require(
            Ownable(insurancePool).owner() == address(this),
            "DAO must own insurance pool"
        );

        // Add the treasury address to the NFT pool
        // IGraviPoolNFT pool = IGraviPoolNFT(nftPool);
        nftPool.addTreasuryAddress(insurancePool);

        insurancePools[poolName] = IGraviInsurance(insurancePool);
        // nftPools[poolName] = nftPool;
        insurancePoolNames.push(poolName);

        // Automatically grant minter role for GraviCha to both contracts
        graviCha.addMinter(insurancePool);
        // graviCha.addMinter(nftPool);

        emit InsuranceCreated(poolName, insurancePool);
        // emit NFTPoolAdded(nftPool);
    }

    function removeInsurancePool(
        string memory insuranceName
    ) external onlyGovernance {
        address insPool = address(insurancePools[insuranceName]);
        // address nftPoolAddr = nftPools[insuranceName];
        require(
            insPool != address(0),
            "Pool does not exist"
        );

        // Revoke minter roles from both pools
        graviCha.removeMinter(insPool);
        // graviCha.removeMinter(nftPoolAddr);

        // Remove from mappings
        delete insurancePools[insuranceName];
        // delete nftPools[insuranceName];

        emit InsuranceRemoved(insuranceName, insPool);
        // emit NFTPoolRemoved(nftPoolAddr);
    }

    function getInsurancePoolAddresses(
        string memory insuranceName
    )
        external
        view
        returns (address insurancePoolAddress, address nftPoolAddress)
    {
        insurancePoolAddress = address(insurancePools[insuranceName]);
        nftPoolAddress = address(nftPool);
    }

    function getAllInsurancePoolNames()
        external
        view
        returns (string[] memory)
    {
        return insurancePoolNames;
    }

    // function monthlyMintNFTForPool(
    //     string memory insuranceName,
    //     string[] calldata tokenURIs
    // ) external onlyGovernanceOrInitialDeployer {
    //     address nftPoolAddress = nftPools[insuranceName];
    //     require(nftPoolAddress != address(0), "NFT pool not found");
    //     IGraviPoolNFT pool = IGraviPoolNFT(nftPoolAddress);
    //     pool.mintAndAuctionNFTs(tokenURIs);
    // }
    function monthlyMintNFTForPool(
        string memory insuranceName,
        string[] calldata tokenURIs
    ) external onlyGovernanceOrInitialDeployer {
        address nftPoolAddress = address(nftPool);
        require(nftPoolAddress != address(0), "NFT pool not found");

        // Get the insurance contract address for this insurance pool.
        address insuranceAddress = address(insurancePools[insuranceName]);
        require(insuranceAddress != address(0), "Insurance pool not found");

        // Build an array of insurance addresses (same for each NFT).
        address[] memory insuranceAddresses = new address[](tokenURIs.length);
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            insuranceAddresses[i] = insuranceAddress;
        }

        IGraviPoolNFT pool = IGraviPoolNFT(nftPoolAddress);
        pool.mintAndAuctionNFTs(tokenURIs, insuranceAddresses);
    }

    /// @notice Move Ether from an insurance pool to a recipient address. For emergency use.
    function moveEtherFromInsurance(
        string memory insuranceName,
        address payable recipient,
        uint256 amount
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");

        // Assuming the insurance contract has a transferEther function callable by its owner (the DAO)
        insurance.transferEther(recipient, amount);
    }

    // ---------------------------------------------------
    // 3. Insurance Disaster Event Recording and Management
    // ---------------------------------------------------
    function recordDisasterEvent(
        string memory insuranceName,
        string memory eventName,
        string memory eventDescription,
        uint256 disasterDate,
        //uint256 donationAmount, // In ETH
        address[] calldata initialModerators
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.addDisasterEvent(
            eventName,
            eventDescription,
            disasterDate,
            initialModerators
        );
    }

    // function updateDonationAmount(
    //     string memory insuranceName,
    //     string memory eventId,
    //     uint256 newDonationAmount
    // ) external onlyGovernance {
    //     IGraviInsurance insurance = insurancePools[insuranceName];
    //     require(address(insurance) != address(0), "Insurance pool not found");
    //     insurance.modifyDonationAmount(eventId, newDonationAmount);
    // }

    function modifyDisasterEvent(
        string memory insuranceName,
        string memory eventId, // Identifier for the event to modify
        string memory newEventDescription,
        uint256 newDisasterDate
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.modifyDisasterEvent(
            eventId,
            insuranceName,
            newEventDescription,
            newDisasterDate
        );
    }

    function removeDisasterEvent(
        string memory insuranceName,
        string memory eventId
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.removeDisasterEvent(eventId);
    }

    function addClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.addClaimModerator(eventId, moderator);
    }

    function removeClaimModerator(
        string memory insuranceName,
        string memory eventId,
        address moderator
    ) external onlyGovernance {
        IGraviInsurance insurance = insurancePools[insuranceName];
        require(address(insurance) != address(0), "Insurance pool not found");
        insurance.removeClaimModerator(eventId, moderator);
    }

    // // ---------------------------------------------------
    // // 4. Staking for GraviGov Tokens and Voting Rewards
    // // ---------------------------------------------------
    // // Update a staker's reward balance based on the time elapsed
    // function updateReward(address account) internal {
    //     uint256 timeDiff = block.timestamp - lastRewardUpdate[account];
    //     if (stakedGov[account] > 0) {
    //         stakingRewardBalance[account] += stakedGov[account] * timeDiff * stakingRewardRate;
    //     }
    //     lastRewardUpdate[account] = block.timestamp;
    // }

    // function stakeGovTokens(uint256 amount) external {
    //     require(amount > 0, "Amount must be greater than zero");
    //     updateReward(msg.sender);
    //     require(graviGov.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    //     stakedGov[msg.sender] += amount;
    //     emit Staked(msg.sender, amount);
    // }

    // function unstakeGovTokens(uint256 amount) external {
    //     require(amount > 0 && amount <= stakedGov[msg.sender], "Invalid unstake amount");
    //     updateReward(msg.sender);
    //     stakedGov[msg.sender] -= amount;
    //     require(graviGov.transfer(msg.sender, amount), "Transfer failed");
    //     emit Unstaked(msg.sender, amount);
    // }

    // function claimStakingRewards() external {
    //     updateReward(msg.sender);
    //     uint256 reward = stakingRewardBalance[msg.sender];
    //     require(reward > 0, "No rewards available");
    //     stakingRewardBalance[msg.sender] = 0;
    //     graviCha.mint(msg.sender, reward);
    //     emit StakingRewardClaimed(msg.sender, reward);
    // }

    // function setStakingRewardRate(uint256 newRate) external onlyGovernance {
    //     stakingRewardRate = newRate;
    // }

    // // function _castVote(
    //     uint256 proposalId,
    //     address account,
    //     uint8 support,
    //     string memory reason
    // ) internal virtual override returns (uint256) {
    //     // Call the parent _castVote implementation using default params
    //     uint256 voteResult = super._castVote(proposalId, account, support, reason);
    //     // Award vote reward if not already given for this proposal
    //     if (!voteRewarded[proposalId][account]) {
    //         voteRewarded[proposalId][account] = true;
    //         graviCha.mint(account, voteRewardAmount);
    //     }

    //     return voteResult;
    // }

    // function setVoteRewardAmount(uint256 newAmount) external onlyGovernance {
    //     voteRewardAmount = newAmount;
    // }

    // ---------------------------------------------------
    // 5. GraviCha Token Management
    // ---------------------------------------------------
    function addCharityMinterRole(address newMinter) external onlyGovernance {
        graviCha.addMinter(newMinter);
    }

    function removeCharityMinterRole(address minter) external onlyGovernance {
        graviCha.removeMinter(minter);
    }

    // ---------------------------------------------------
    // 6. Other important functions
    // ---------------------------------------------------
    // function getEtherBalance() external view returns (uint256) {
    //     return address(this).balance;
    // }

    // Arbitrary ether transfer function, can transfer to any address, but used primary to add fund to insurance pools
    function transferEther(
        address payable recipient,
        uint256 amount
    ) external onlyGovernance {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Ether transfer failed");
    }

    // ---------------------------------------------------
    // 7. Dao override for Governor parameters
    // ---------------------------------------------------
    // Note this sets it in terms of blocks not seconds
    function setGovParameters(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold
    ) external onlyGovernanceOrInitialDeployer {
        govVotingDelay = _votingDelay;
        govVotingPeriod = _votingPeriod;
        govProposalThreshold = _proposalThreshold;
    }

    // function setVotingDelay(uint256 newDelay) external onlyGovernance {
    //     govVotingDelay = newDelay;
    // }

    // function setVotingPeriod(uint256 newPeriod) external onlyGovernance {
    //     govVotingPeriod = newPeriod;
    // }

    // function setProposalThreshold(uint256 newThreshold) external onlyGovernance {
    //     govProposalThreshold = newThreshold;
    // }

    // ---------------------------------------------------
    // Governance parameters required by Governor
    // ---------------------------------------------------
    function votingDelay() public view override(Governor, IGovernor) returns (uint256) {
        return govVotingDelay;
    }

    function votingPeriod() public view override(Governor, IGovernor) returns (uint256) {
        return govVotingPeriod;
    }

    function proposalThreshold() public view override(Governor, IGovernor) returns (uint256) {
        return govProposalThreshold;
    }

    // ---------------------------------------------------
    // Overrides required by Solidity.
    // ---------------------------------------------------
    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl, IGovernor)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    )
        public
        view
        virtual
        override(Governor, GovernorTimelockControl, IGovernor)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return
            super._queueOperations(
                proposalId,
                targets,
                values,
                calldatas,
                descriptionHash
            );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    // function setGovTokenEthPrice(uint256 newPrice) external override {}

    // function setGovTokenGraviChaBurn(uint256 newBurnAmount) external override {}
}