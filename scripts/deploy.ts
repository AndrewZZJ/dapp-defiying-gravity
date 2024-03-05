import { ethers } from "hardhat";

async function main() {
  const greetingString = "Hello EECE571G";

  const txValue = 0;

  const greeter = await ethers.deployContract("Greeter", [greetingString], {
    value: txValue,
  });

  await greeter.waitForDeployment();

  console.log(
    `Greeter with ${greetingString} deployed to ${greeter.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
