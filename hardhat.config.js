require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "fluent-testnet": {
      url: "https://rpc.testnet.fluent.xyz",
      chainId: 20994,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      "fluent-testnet": "your-api-key-here", // Replace with actual API key if available
    },
    customChains: [
      {
        network: "fluent-testnet",
        chainId: 20994,
        urls: {
          apiURL: "https://testnet.fluentscan.xyz/api",
          browserURL: "https://testnet.fluentscan.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
