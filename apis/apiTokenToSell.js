const { EvmChain } = require("@moralisweb3/common-evm-utils");
const covalent = require("../helpers/covalent");
const logger = require("../helpers/logger");
const { ethers } = require("ethers");
const { PublicKey } = require("@solana/web3.js");
const {
  getCoinUsdPrice,
  getCoinInfoByAddress,
  getImageByAddress,
} = require("./coingecko");
const getWallet = require("../databases/getWallet");
const Moralis = require("moralis").default;

const apiTokenToSell = async (request, reply) => {
  const { chain_used, wallet_number } = request.query;
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
    const chat_id = request.chatId;
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
        respW = await covalent.BalanceService.getTokenBalancesForWalletAddress(
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

    let result = [];

    await Promise.all(
      token_list.map(async (x) => {
        const formatAmount = x.balance * 10 ** (-1 * x.decimals);
        const usdPrice = await getCoinUsdPrice(chainIdx, x.token_address);
        const image = await getImageByAddress(chainIdx, x.token_address);

        result.push({
          name: x.name,
          symbol: x.symbol,
          decimals: x.decimals,
          address: x.token_address,
          image_url: image,
          balance: formatAmount,
          usd_price: usdPrice,
        });
      })
    );

    return reply.code(200).send(result);
  } catch (e) {
    console.error(e);
    logger.error("API LIST TOKEN TO SELL ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTokenToSell;
