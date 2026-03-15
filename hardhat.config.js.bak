require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.25",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200 // Vital for reducing Gas Fees on Mainnet
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111, // Matches your screenshot
      timeout: 60000 //This prevents timeput of token allocation to Crowdsale 15B, Vesting Vault 20B, Transaction Reserve 15B 
    },
    // We will add Mainnet here later
    // mainnet: { ... }
  },

  // ADD OR UPDATE THIS SECTION:
  etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY
},
  sourcify: {
    enabled: true
  }
};