const { EvmChain } = require("@moralisweb3/common-evm-utils");
const covalent = require("../helpers/covalent");
const logger = require("../helpers/logger");
const getWallet = require("../databases/getWallet");
const { ethers } = require("ethers");
const { PublicKey, Connection } = require("@solana/web3.js");
const {
  getCoinUsdPrice,
  getImageByAddress,
  getCoinInfo,
} = require("./coingecko");
const checkBalance = require("../helpers/checkBalance");
const checkBalanceSolana = require("../helpers/solana/checkBalance");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const dexGetUsdPrice = require("../helpers/dexScreener");
const Moralis = require("moralis").default;

const apiShowTokenDetail = async function (request, reply) {
  const { chain_used, wallet_number, filter } = request.query;
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
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainIdx].rpc_provider
    );
    const solanaProvider = new Connection(
      chains[chainIdx].rpc_provider,
      "confirmed"
    );

    //
    let walletPK,
      wallet,
      wallet_balance = null;
    if (chainIdx !== 4) {
      walletPK = await getWallet(chat_id, Number(wallet_number), chainIdx);
      const theWallet = new ethers.Wallet(walletPK);
      wallet = theWallet.address;
      wallet_balance = await checkBalance(provider, wallet);
    } else {
      walletPK = await getWallet(chat_id, Number(wallet_number), chainIdx);
      const accounts = await walletPK.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      wallet = publicKey.toBase58();
      wallet_balance = await checkBalanceSolana(solanaProvider, wallet);
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
              balance: balanceValue * 10 ** (-1 * x.contract_decimals),
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

        //
        const solBalance = await Moralis.SolApi.account.getBalance({
          network: selectedChain,
          address: wallet,
        });

        if (Number(solBalance.jsonResponse.solana) !== 0) {
          token_list.push({
            token_address: "So11111111111111111111111111111111111111112",
            name: "Solana",
            symbol: "SOL",
            balance: solBalance.jsonResponse.solana,
            decimals: 9,
            wallet: 1,
          });
        }
        respW.toJSON().forEach((x) => {
          token_list.push({
            token_address: x.mint,
            name: x.name,
            symbol: x.symbol,
            balance: x.amountRaw * 10 ** (-1 * x.decimals),
            decimals: x.decimals,
          });
        });
        break;
      default:
        respW = await Moralis.EvmApi.token.getWalletTokenBalances({
          address: wallet,
          chain: selectedChain,
        });

        //
        if (Number(wallet_balance.balance) !== 0) {
          token_list.push({
            token_address: null,
            name: chainIdx === 2 ? "Avalanche" : "Ethereum",
            symbol: chainIdx === 2 ? "AVAX" : "ETH",
            balance: Number(wallet_balance.balance),
            decimals: 18,
            wallet: 1,
          });
        }

        respW.toJSON().forEach(async (x) => {
          token_list.push({
            token_address: x.token_address,
            name: x.name,
            symbol: x.symbol,
            balance: x.balance * 10 ** (-1 * x.decimals),
            decimals: x.decimals,
          });
        });
    }

    await Promise.all(
      token_list.map(async (x) => {
        let usdPrice = null;
        if (x.token_address === null) {
          if (chainIdx === 2) {
            usdPrice = await this.redis.GET("avausd");
            const image = await getCoinInfo("avalanche-2");
            x.image_url = image.image.large;
          } else {
            usdPrice = await this.redis.GET("ethusd");
            const image = await getCoinInfo("ethereum");
            x.image_url = image.image.large;
          }
        } else {
          usdPrice = await dexGetUsdPrice(x.token_address);
          console.log({ usdPrice });
          x.image_url = await getImageByAddress(chainIdx, x.token_address);
        }
        x.usd_price = usdPrice ? Number(usdPrice) * x.balance : 0;
      })
    );

    //
    let sortedTokenList = token_list;
    if (filter) {
      sortedTokenList = sortedTokenList.filter((value) =>
        value.name.includes(filter)
      );
    }

    return reply.code(200).send(...sortedTokenList);
  } catch (e) {
    logger.error("API SHOW TOKEN BALANCE ERROR: ");
    console.error(e);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiShowTokenDetail;
