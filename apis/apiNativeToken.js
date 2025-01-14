const { EvmChain } = require("@moralisweb3/common-evm-utils");
const getTokenAddress = require("../databases/getTokenAddress");
const getTokenImage = require("../databases/getTokenImage");
const logger = require("../helpers/logger");
const { ethers } = require("ethers");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { Connection } = require("@solana/web3.js");
const checkBalance = require("../helpers/checkBalance");
const { checkBalanceSolana } = require("../helpers");
const { formatNumber } = require("../helpers/abbreviateNumber");
const covalent = require("../helpers/covalent");
const { getCoinUsdPrice } = require("./coingecko");
const Moralis = require("moralis").default;

const apiNativeToken = async function (request, reply) {
  const { chain_used, wallet_address } = request.query;
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
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    //get native coin balance
    const selectedChain = {
      0: EvmChain.ETHEREUM,
      1: EvmChain.ARBITRUM,
      2: EvmChain.AVALANCHE,
      3: "metis-mainnet",
      4: "mainnet",
    }[chainIdx];

    //native usd price
    const chainUsd = {
      0: "ethusd",
      1: "ethusd",
      2: "avausd",
      3: "metisusd",
      4: "solusd",
    }[chainIdx];
    const usdPrice = await this.redis.GET(chainUsd);

    //
    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainIdx].rpc_provider
    );

    const solanaProvider = new Connection(
      chains[chainIdx].rpc_provider,
      "confirmed"
    );
    let info = null;
    if (chainIdx !== 4) {
      info = await checkBalance(provider, wallet_address);
    } else {
      info = await checkBalanceSolana(solanaProvider, wallet_address);
    }

    // get currencies balance
    let tokenBalance = [];
    switch (chainIdx) {
      case 3:
        const respWallet =
          await covalent.BalanceService.getTokenBalancesForWalletAddress(
            selectedChain,
            wallet_address
          );

        respWallet.data.items.forEach((x) => {
          const balanceValue = Number(x.balance);
          if (balanceValue !== 0) {
            tokenBalance.push({
              symbol: x.contract_ticker_symbol,
              balance: balanceValue,
              decimals: x.contract_decimals,
              token_address: x.contract_address,
            });
          }
        });
        break;
      case 4:
        const solanaWallet = await Moralis.SolApi.account.getSPL({
          network: selectedChain,
          address: wallet_address,
        });

        solanaWallet.toJSON().forEach((x) => {
          tokenBalance.push({
            symbol: x.symbol,
            balance: x.amountRaw,
            decimals: x.decimals,
          });
        });
        break;
      default:
        const response = await Moralis.EvmApi.token.getWalletTokenBalances({
          address: wallet_address,
          chain: selectedChain,
        });

        tokenBalance = response.toJSON();
    }

    // check usdt usdc balance
    const checkUsdBalance = (walletRes) => {
      const usdTokenBalance = {};

      for (let i = 0; i < walletRes.length; i++) {
        const tokenList = walletRes[i];
        const balance = formatNumber(
          Number(tokenList.balance * 10 ** (-1 * tokenList.decimals))
        );
        usdTokenBalance[tokenList.symbol] = balance;
      }
      return usdTokenBalance;
    };

    //check in wallet
    const currenciesBalance = checkUsdBalance(tokenBalance);

    //
    const nativeTokens = {
      1: {
        name: "Ethereum",
        symbol: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        image: await getTokenImage("ethereum"),
        balance: formatNumber(info.balance),
        usd_price: Number(usdPrice),
      },
      2: {
        name: "Avalanche",
        symbol: "AVAX",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        image: await getTokenImage("avalanche-2"),
        balance: formatNumber(info.balance),
        usd_price: Number(usdPrice),
      },
      3: {
        name: "Metis",
        symbol: "METIS",
        address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
        image: await getTokenImage("metis-token"),
        balance: formatNumber(info.balance),
        usd_price: Number(usdPrice),
      },
      4: {
        name: "Solana",
        symbol: "SOL",
        address: "So11111111111111111111111111111111111111112",
        image: await getTokenImage("solana"),
        balance: formatNumber(info.balance),
        usd_price: Number(usdPrice),
      },
    };
    nativeTokens[0] = nativeTokens[1];

    const usdt_address = await getTokenAddress(chainIdx, "USDT");
    const usdt_image = await getTokenImage("tether");
    const usdc_address = await getTokenAddress(chainIdx, "USDC");
    const usdc_image = await getTokenImage("usd-coin");
    // console.log({ usdt_address, usdc_address });

    //get usd price usdt and usdc
    const usdt_price = await getCoinUsdPrice(chainIdx, usdt_address);
    const usdc_price = await getCoinUsdPrice(chainIdx, usdc_address);

    const response = [
      nativeTokens[chainIdx],
      {
        name: "Tether",
        symbol: "USDT",
        address: usdt_address,
        image: usdt_image,
        balance:
          currenciesBalance.USDT ||
          currenciesBalance["m.USDT"] ||
          currenciesBalance["USDt"]
            ? currenciesBalance.USDT ||
              currenciesBalance["m.USDT"] ||
              currenciesBalance["USDt"]
            : 0,
        usd_price: usdt_price,
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: usdc_address,
        image: usdc_image,
        balance:
          currenciesBalance.USDC || currenciesBalance["m.USDC"]
            ? currenciesBalance.USDC || currenciesBalance["m.USDC"]
            : 0,
        usd_price: usdc_price,
      },
    ];

    reply.code(200).send(response);
  } catch (e) {
    logger.error("API NATIVE TOKEN: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiNativeToken;
