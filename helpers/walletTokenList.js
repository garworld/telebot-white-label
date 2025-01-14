const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");
const covalent = require("../helpers/covalent");
const logger = require("../helpers/logger");
const getWallet = require("../databases/getWallet");
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const Moralis = require("moralis").default;

const walletTokenList = (chain_used, wallet_number, chat_id) => {
  return new Promise(async (resolve) => {
    try {
      const chainIdx = {
        1: 0,
        42161: 1,
        43114: 2,
        1088: 3,
        1399811149: 4,
        8453: 5,
      }[Number(chain_used)];

      //
      const selectedChain = {
        0: EvmChain.ETHEREUM,
        1: EvmChain.ARBITRUM,
        2: EvmChain.AVALANCHE,
        3: "metis-mainnet",
        4: "mainnet",
      }[chainIdx];

      //
      let walletPK,
        wallet = null;
      if (chainIdx !== 4) {
        walletPK = await getWallet(chat_id, Number(wallet_number), chainIdx);
        const theWallet = new ethers.Wallet(walletPK);
        wallet = theWallet.address;
      } else {
        walletPK = await getWallet(chat_id, Number(wallet_number), chainIdx);
        const accounts = await walletPK.requestAccounts();
        const publicKey = new PublicKey(accounts[0]);
        wallet = publicKey.toBase58();
      }
      const token_list = [];

      let respW;
      switch (chainIdx) {
        case 3:
          respW =
            await covalent.BalanceService.getTokenBalancesForWalletAddress(
              selectedChain,
              wallet
            );
          respW.data.items.forEach(async (x) => {
            const balanceValue = Number(x.balance);
            if (balanceValue !== 0) {
              token_list.push({
                token_address: x.contract_address,
                name: x.contract_name,
                symbol: x.contract_ticker_symbol,
                balance: balanceValue,
                decimals: x.contract_decimals,
              });
            }
          });
          break;
        case 4:
          respW = await Moralis.SolApi.account.getSPL({
            network: selectedChain,
            address: wallet,
          });
          respW.toJSON().forEach((x) => {
            token_list.push({
              token_address: x.mint,
              name: x.name,
              symbol: x.symbol,
              balance: x.amountRaw,
              decimals: x.decimals,
            });
          });
          break;
        default:
          respW = await Moralis.EvmApi.token.getWalletTokenBalances({
            address: wallet,
            chain: selectedChain,
          });
          respW.toJSON().forEach(async (x) => {
            token_list.push({
              token_address: x.token_address,
              name: x.name,
              symbol: x.symbol,
              balance: x.balance,
              decimals: x.decimals,
            });
          });
      }

      // format balance
      await Promise.all(
        token_list.map(async (x) => {
          const formatAmount = x.balance * 10 ** (-1 * x.decimals);
          x.formatted_balance = formatAmount;
        })
      );

      //
      resolve(token_list);
    } catch (e) {
      logger.error("WALLET TOKEN LIST ERROR: " + e);
      resolve(null);
    }
  });
};

module.exports = walletTokenList;
