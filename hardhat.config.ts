
import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig, NetworkUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-truffle5";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import "dotenv/config";

const bscTestnet: NetworkUserConfig = {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  chainId: 97,
  accounts: [process.env.KEY_TESTNET!],
};

const bscMainnet: NetworkUserConfig = {
  url: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  accounts: [process.env.KEY_MAINNET!],
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
  testnet: bscTestnet,
     mainnet: bscMainnet,
  },
  etherscan: {
    apiKey: process.env?.BSCSCAN_API_KEY,
  }, 
  contractSizer:{
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict:true,
    only: ["CORAI"],
  },
  solidity: "0.8.17",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  abiExporter: {
    path: "./abi",
    clear: true,
    flat: false,
  },
};

export default config;

