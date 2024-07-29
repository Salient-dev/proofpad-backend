require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
require('solidity-coverage');
require("hardhat-gas-reporter");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    artifacts: '../src/artifacts',
  },
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      blockGasLimit: 300000000429720
    },
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 300009999429720 // whatever you want here
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_PROVIDER_KEY}`,
      chainId: 80001,
      accounts: [process.env.DEPLOYER_WALLET_PRIVATE_KEY],
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  }
};