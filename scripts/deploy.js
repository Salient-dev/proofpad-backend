const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  const OpenBadgesProfileManagerFactory = await ethers.getContractFactory("OpenBadgesProfileManager");
  const OpenBadgesProfileManager = await OpenBadgesProfileManagerFactory.deploy();
  await OpenBadgesProfileManager.deployed();

  console.log(
    "OpenBadgesProfileManager deployed to:",
    OpenBadgesProfileManager.address
  );

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});