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
const Moralis = require("moralis").default;

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

const getTokenBalance = (chainId, walletAddress) => {
  return new Promise(async (resolve) => {
    try {
      const chainIdx = {
        1: 0,
        42161: 1,
        43114: 2,
        1088: 3,
        1399811149: 4,
        8453: 5,
      }[Number(chainId)];

      //
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // get native coin balance
      const selectedChain = {
        0: EvmChain.ETHEREUM,
        1: EvmChain.ARBITRUM,
        2: EvmChain.AVALANCHE,
        3: "metis-mainnet",
        4: "mainnet",
        5: EvmChain.BASE,
      }[chainIdx];

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
        info = await checkBalance(provider, walletAddress);
      } else {
        info = await checkBalanceSolana(solanaProvider, walletAddress);
      }

      // get currencies balance
      let tokenBalance = [];
      switch (chainIdx) {
        case 3:
          const respWallet =
            await covalent.BalanceService.getTokenBalancesForWalletAddress(
              selectedChain,
              walletAddress
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
            address: walletAddress,
          });

          solanaWallet.toJSON().forEach((x) => {
            tokenBalance.push({
              token_address: x.associatedTokenAddress,
              symbol: x.symbol,
              balance: x.amountRaw,
              decimals: x.decimals,
            });
          });
          break;
        default:
          const response = await Moralis.EvmApi.token.getWalletTokenBalances({
            address: walletAddress,
            chain: selectedChain,
          });

          tokenBalance = response.toJSON();
      }

      // check in wallet
      const currenciesBalance = checkUsdBalance(tokenBalance);

      //
      const nativeTokens = {
        1: {
          name: "Ethereum",
          symbol: "ETH",
          address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          image: await getTokenImage("ethereum"),
          balance: formatNumber(info.balance),
        },
        2: {
          name: "Avalanche",
          symbol: "AVAX",
          address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          image: await getTokenImage("avalanche-2"),
          balance: formatNumber(info.balance),
        },
        3: {
          name: "Metis",
          symbol: "METIS",
          address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
          image: await getTokenImage("metis-token"),
          balance: formatNumber(info.balance),
        },
        4: {
          name: "Solana",
          symbol: "SOL",
          address: "So11111111111111111111111111111111111111112",
          image: await getTokenImage("solana"),
          balance: formatNumber(info.balance),
        },
      };
      nativeTokens[0] = nativeTokens[1];

      const usdt_address = await getTokenAddress(chainIdx, "USDT");
      const usdt_image = await getTokenImage("tether");
      const usdc_address = await getTokenAddress(chainIdx, "USDC");
      const usdc_image = await getTokenImage("usd-coin");
      // console.log({ usdt_address, usdc_address });

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
        },
      ];

      //
      resolve(response);
    } catch (err) {
      logger.error("GET TOKEN BALANCE ERROR: " + err.message);

      resolve(null);
    }
  });
};

module.exports = {
  getTokenBalance,
};
