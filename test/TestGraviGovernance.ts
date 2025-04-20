import { expect } from "chai";
import { ethers } from "hardhat";
import { GraviGovernance, GraviGov, GraviCha, TimelockController } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("GraviGovernance", function () {
  async function deployGovernanceFixture() {
    const [owner, proposer, voter1, voter2, voter3] = await ethers.getSigners();
    
    // Deploy tokens
    const GraviChaFactory = await ethers.getContractFactory("GraviCha");
    const graviCha = await GraviChaFactory.deploy();
    
    const GraviGovFactory = await ethers.getContractFactory("GraviGov");
    const graviGov = await GraviGovFactory.deploy();
    
    // Deploy timelock with minimal delay for testing
    const minDelay = 1; // 1 second delay
    const proposers: string[] = [];
    const executors: string[] = [];
    const admin = owner.address;
    
    const TimelockFactory = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockFactory.deploy(minDelay, proposers, executors, admin);
    
    // Deploy governance
    const GraviGovernanceFactory = await ethers.getContractFactory("GraviGovernance");
    const graviGovernance = await GraviGovernanceFactory.deploy(
      await graviGov.getAddress(), 
      await timelock.getAddress(),
      await graviCha.getAddress()
    );
    
    // Set up roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    
    await timelock.grantRole(PROPOSER_ROLE, await graviGovernance.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE, await graviGovernance.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE, owner.address); // So owner can execute directly for tests
    await timelock.grantRole(CANCELLER_ROLE, owner.address);
    
    // Mint governance tokens and delegate to self
    await graviGov.mint(proposer.address, ethers.parseEther("1000"));
    await graviGov.mint(voter1.address, ethers.parseEther("2000"));
    await graviGov.mint(voter2.address, ethers.parseEther("1500"));
    await graviGov.mint(voter3.address, ethers.parseEther("500"));
    
    await graviGov.connect(proposer).delegate(proposer.address);
    await graviGov.connect(voter1).delegate(voter1.address);
    await graviGov.connect(voter2).delegate(voter2.address);
    await graviGov.connect(voter3).delegate(voter3.address);
    
    // Add graviGovernance as a minter for GraviCha
    await graviCha.addMinter(await graviGovernance.getAddress());
    
    return {
      graviGovernance, graviGov, graviCha, timelock,
      owner, proposer, voter1, voter2, voter3
    };
  }

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      const { graviGovernance, graviCha } = await loadFixture(deployGovernanceFixture);
      
      // Check token connections
      const [rewardsEnabled, rewardAmount, tokenAddress] = await graviGovernance.getRewardInfo();
      expect(tokenAddress).to.equal(await graviCha.getAddress());
      expect(rewardsEnabled).to.be.true;
      expect(rewardAmount).to.equal(ethers.parseEther("0.1"));
      
      // Check governance parameters
      expect(await graviGovernance.votingDelay()).to.equal(0);
      expect(await graviGovernance.votingPeriod()).to.be.gt(0);
      expect(await graviGovernance.proposalThreshold()).to.equal(1000);
    });
  });

  describe("Proposal Management", function () {
    it("Should create a proposal with reward", async function () {
      const { graviGovernance, graviCha, proposer } = await loadFixture(deployGovernanceFixture);
      
      // Get initial balance
      const initialBalance = await graviCha.balanceOf(proposer.address);
      
      const title = "Test Proposal with Reward";
      const description = "This is a test proposal description";
      const targets = [await graviGovernance.getAddress()];
      const values = [0];
      const calldatas = [
        graviGovernance.interface.encodeFunctionData("setVoteRewardAmount", [ethers.parseEther("0.2")])
      ];
      
      // Create proposal with reward
      await graviGovernance.connect(proposer).createProposalWithReward(
        title,
        description,
        targets,
        values,
        calldatas
      );
      
      // Check that reward was issued
      const finalBalance = await graviCha.balanceOf(proposer.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Proposal Listings", function () {
    it("Should return all proposal IDs correctly", async function () {
      const { graviGovernance, proposer } = await loadFixture(deployGovernanceFixture);
      
      // Create multiple proposals
      const createProposal = async (title: string) => {
        return graviGovernance.connect(proposer).createProposal(
          title,
          `Description for ${title}`,
          [await graviGovernance.getAddress()],
          [0],
          [graviGovernance.interface.encodeFunctionData("setVoteRewardAmount", [ethers.parseEther("0.2")])]
        );
      };
      
      // Create 3 proposals
      await createProposal("Proposal 1");
      await createProposal("Proposal 2");
      await createProposal("Proposal 3");
      
      // Get all proposal IDs
      const proposalIds = await graviGovernance.getAllProposalIds();
      expect(proposalIds.length).to.equal(3);
    });
    
    it("Should return correct proposal count", async function () {
      const { graviGovernance, proposer } = await loadFixture(deployGovernanceFixture);
      
      // Create a proposal
      await graviGovernance.connect(proposer).createProposal(
        "Test Proposal",
        "Description",
        [await graviGovernance.getAddress()],
        [0],
        [graviGovernance.interface.encodeFunctionData("setVoteRewardAmount", [ethers.parseEther("0.2")])]
      );
      
      // Get proposal count
      const count = await graviGovernance.getProposalCount();
      expect(count).to.equal(1);
    });
  });
});
