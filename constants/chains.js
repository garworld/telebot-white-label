//
require("dotenv").config();

const DATA_CHAIN_LIST = [
  {
    text: "Ethereum Mainnet",
    callback_data: "!chain:1",
    chain_id: 1,
    rpc_provider: process.env.ETH_RPC_PROVIDER,
    chain_scanner: "https://etherscan.io",
  },
  {
    text: "Arbitrum",
    callback_data: "!chain:42161",
    chain_id: 42161,
    rpc_provider: process.env.ARB_RPC_PROVIDER,
    chain_scanner: "https://arbiscan.io",
  },
  {
    text: "Avalanche C-Chain",
    callback_data: "!chain:43114",
    chain_id: 43114,
    rpc_provider: process.env.AVA_RPC_PROVIDER,
    chain_scanner: "https://snowtrace.io",
  },
  {
    text: "Metis Andromeda",
    callback_data: "!chain:1088",
    chain_id: 1088,
    rpc_provider: process.env.METIS_RPC_PROVIDER,
    chain_scanner: "https://explorer.metis.io",
  },
  {
    text: "Solana",
    callback_data: "!chain:1399811149",
    chain_id: 1399811149,
    rpc_provider: process.env.SOLANA_RPC_PROVIDER,
    chain_scanner: "https://solscan.io",
  },
  {
    text: "Base Mainnet",
    callback_data: "!chain:8453",
    chain_id: 8453,
    // rpc_provider: process.env.BASE_RPC_PROVIDER,
    rpc_provider:
      "https://base-mainnet.g.alchemy.com/v2/du4vJJm3V-uYVc2gnDL3PAHquXxeAoWU",
    chain_scanner: "https://basescan.org",
  },
];

module.exports = { DATA_CHAIN_LIST };
