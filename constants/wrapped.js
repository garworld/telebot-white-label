//
require("dotenv").config();

const DATA_WRAPPED = [
  {
    text: "Ethereum Mainnet",
    chain_id: 1,
    wrapped: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  {
    text: "Arbitrum",
    chain_id: 42161,
    wrapped: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  {
    text: "Avalanche C-Chain",
    chain_id: 43114,
    wrapped: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
  },
  {
    text: "Metis Andromeda",
    chain_id: 1088,
    wrapped: null,
  },
  {
    text: "Solana",
    chain_id: 1399811149,
    wrapped: null,
  },
  {
    text: "Base Mainnet",
    chain_id: 8453,
    wrapped: "0x4200000000000000000000000000000000000006",
  },
];

module.exports = { DATA_WRAPPED };
