//
require("dotenv").config();

//
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const axios = require("axios");
const axiosRetry = require("axios-retry");
const Moralis = require("moralis").default;
const roundTo = require("round-to");

//
const logger = require("./logger");
const { resolve } = require("app-root-path");
const { apiHeraRequestUrl } = require("./hera");
const fetch = require("node-fetch");

// //
// const url =
//   process.env.BASE_ETHERSCAN_URL +
//   "/api?module=stats&action=ethprice&apikey=" +
//   process.env.ETHERSCAN_KEY;

//
const reqOpts = {
  headers: {
    Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
    accept: "application/json",
  },
};

//
axiosRetry(axios, {
  retryDelay: (retryCount) => {
    return retryCount * 1000;
  },
  retryCondition: (err) => err.response && err.response.status === 429,
});

/**
 * ethUsd()
 *
 * @returns { Promise<Number> }
 */
const ethUsd = () => {
  return new Promise(async (resolve) => {
    try {
      const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      const chain = EvmChain.ETHEREUM;

      const response = await Moralis.EvmApi.token.getTokenPrice({
        address: WETH,
        chain,
      });
      const result = response.toJSON();

      resolve(roundTo(Number(result.usdPriceFormatted || 1), 0));
      // const response = await axios.get(url);
      // // console.log(response.data);
      // response.data.result?.ethusd
      //   ? resolve(roundTo(Number(response.data.result.ethusd), 0))
      //   : resolve(1);
    } catch (err) {
      // console.error("TOKEN PRICE ETH USD ERROR: ", e);
      logger.error("TOKEN PRICE ETH USD ERROR: " + err.message);
      resolve(1);
    }
  });
};

/**
 * @typedef { object } TokenInfo
 * @property { string } symbol - The symbol of the token
 * @property { string } name - The name of the token
 * @property { number } decimals - The decimals
 * @property { string } address - The token address
 * @property { string } logoURI - The logoURI of the token
 * @property { string[] } tags - The tags
 */

/**
 * @typedef { object } QuoteResponse
 * @property { string } toAmount - The toAmount
 * @property { TokenInfo } fromToken - The fromToken
 * @property { TokenInfo } toToken - The toToken
 */

/**
 * oneInchSwapQuote(chainidx, from, address, amount)
 *
 * @param { number } chainidx
 * @param { string } from
 * @param { string } address
 * @param { string } amount
 * @returns { Promise<QuoteResponse | Error> }
 */
const oneInchSwapQuote = (chainidx, from, address, amount) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      let chain;

      //
      switch (chainidx) {
        case 0:
          chain = EvmChain.ETHEREUM;
          break;
        case 1:
          chain = EvmChain.ARBITRUM;
          break;
        case 2:
          chain = EvmChain.AVALANCHE;
          break;
        case 5:
          chain = EvmChain.BASE;
          break;
      }

      //
      // console.log("CHAIN IDX: ", chainidx);
      // console.log("CHAIN: ", chain);

      // console.log("ONE INCH: ", {
      //   chainidx,
      //   from,
      //   address,
      //   amount,
      // });
      // console.log({ amount });

      //
      let amountIn = amount;

      //
      const platformFee = amountIn.div(100);
      amountIn = amountIn.sub(platformFee);

      //
      const oneInchUrl = `https://api.1inch.dev/swap/v5.2/${Number(
        chain.hex
      ).toString()}/quote?src=${from}&dst=${address}&amount=${amountIn}&includeTokensInfo=true`;

      //
      console.log("ONE INCH URL: ", oneInchUrl);

      //
      const response = await axios.get(oneInchUrl, reqOpts);

      //
      resolve(response.data);
    } catch (err) {
      //

      // logger.error("ONE INCH SWAP QUOTE ERROR: " + err.message);
      //
      if (err.status !== 429) {
        reject(err);
      }
    }
  });
};

/**
 * oneInchSwapQuoteNoreject(chainidx, from, address, amount)
 *
 * @param { number } chainidx
 * @param { string } from
 * @param { string } address
 * @param { string } amount
 * @returns { Promise<QuoteResponse | null> }
 */
const oneInchSwapQuoteNoReject = (chainidx, from, address, amount) => {
  return new Promise(async (resolve) => {
    try {
      //
      let chain;
      switch (chainidx) {
        case 0:
          chain = EvmChain.ETHEREUM;
          break;
        case 1:
          chain = EvmChain.ARBITRUM;
          break;
        case 2:
          chain = EvmChain.AVALANCHE;
          break;
        case 5:
          chain = EvmChain.BASE;
          break;
      }

      //
      // console.log("CHAIN IDX: ", chainidx);
      // console.log("CHAIN: ", chain);

      // console.log("ONE INCH QUOTE NO REJECT: ", {
      //   chainidx,
      //   from,
      //   address,
      //   amount,
      // });

      // console.log({ amount });
      let amountIn = amount;
      const platformFee = amountIn.div(100);
      amountIn = amountIn.sub(platformFee);

      //
      const oneInchUrl = `https://api.1inch.dev/swap/v5.2/${Number(
        chain.hex
      ).toString()}/quote?src=${from}&dst=${address}&amount=${amountIn}&includeTokensInfo=true`;

      //
      console.log("ONE INCH URL: ", oneInchUrl);

      //
      const response = await axios.get(oneInchUrl, reqOpts);

      //
      resolve(response.data);
    } catch (err) {
      //

      logger.error("ONE INCH SWAP QUOTE NO REJECT ERROR: " + err.message);

      //
      resolve(null);
    }
  });
};

/**
 * moralisDetails(address)
 *
 * @param { number } chainidx
 * @param { string } address
 * @returns { Promise<import("@moralisweb3/common-evm-utils").GetTokenPriceResponseAdapter | Error> }
 */
const moralisDetails = (chainidx, address) => {
  // console.log({ chainidx });
  return new Promise(async (resolve, reject) => {
    try {
      //
      let chain;
      switch (chainidx) {
        case 0:
          chain = EvmChain.ETHEREUM;
          break;
        case 1:
          chain = EvmChain.ARBITRUM;
          break;
        case 2:
          chain = EvmChain.AVALANCHE;
          break;
        case 5:
          chain = EvmChain.BASE;
          break;
      }

      //
      // console.log("CHAIN IDX: ", chainidx);
      // console.log("CHAIN: ", chain);

      //
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain,
        address,
      });

      //
      resolve(response.raw);
    } catch (err) {
      logger.error("TOKEN PRICE MORALIS DETAILS ERROR: " + err.message);

      //
      reject(err);
    }
  });
};

/**
 * avaUsd()
 *
 * @returns { Promise<number> }
 */
const avaUsd = () => {
  return new Promise(async (resolve) => {
    try {
      const AVAX = "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7";
      const chain = EvmChain.AVALANCHE;

      const response = await Moralis.EvmApi.token.getTokenPrice({
        address: AVAX,
        chain,
      });
      const result = response.toJSON();

      resolve(Number(result.usdPriceFormatted || 1));
      // const response = await axios.get(url);
      // // console.log(response.data);
      // response.data.result?.ethusd
      //   ? resolve(roundTo(Number(response.data.result.ethusd), 0))
      //   : resolve(1);
    } catch (err) {
      // console.error("TOKEN PRICE ETH USD ERROR: ", e);
      logger.error("TOKEN PRICE AVA USD ERROR: " + err.message);
      resolve(1);
    }
  });
};

const heraSwapQuote = (chainidx, from, to, amount, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      let chain_id;
      switch (chainidx) {
        case 3:
          chain_id = 1088;
          break;
      }
      // console.log({ chain_id, from, to, amount, address });
      //
      const heraUrl = "https://pathfindersdk.hera.finance/quote";
      const params = `?account=${address}&tokenInAddress=${from}&tokenInChainId=${chain_id}&tokenOutAddress=${to}&tokenOutChainId=${chain_id}&amount=${amount}&type=exactIn`;

      //
      const response = await axios.get(heraUrl + params);

      //
      resolve(response.data);
    } catch (e) {
      logger.error("HERA SWAP QUOTE ERROR: " + e);
      reject(e);
    }
  });
};

const openOceanSwapQuote = (chainIdx, from, to, amount, slippage, gas = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      let chain_id;
      switch (chainIdx) {
        case 3:
          chain_id = "metis";
          break;
      }

      //
      const baseUrl = `https://open-api.openocean.finance/v3/${chain_id}/quote`;
      const params = `?inTokenAddress=${from}&outTokenAddress=${to}&amount=${amount}&slippage=${slippage}&gasPrice=${gas}`;

      //
      const response = await axios.get(baseUrl + params);
      // console.log(response.data);
      resolve(response.data);
    } catch (e) {
      logger.error("OPEN OCEAN SWAP QUOTE ERROR: " + e);
      reject(e);
    }
  });
};

const jupiterSwapQuote = (from, to, amount, slippage) => {
  return new Promise(async (resolve, reject) => {
    // console.log({ slippage });
    try {
      //
      const baseUrl = `https://quote-api.jup.ag/v6/quote`;
      const params = `?inputMint=${from}&outputMint=${to}&amount=${amount}&slippageBps=${
        slippage * 100
      }`;

      //
      const response = await axios.get(baseUrl + params);
      // console.log(response.data);
      resolve(response.data);
    } catch (e) {
      logger.error("JUPITER SWAP QUOTE ERROR: " + e);
      reject(e);
    }
  });
};

module.exports = {
  ethUsd,
  moralisDetails,
  oneInchSwapQuote,
  oneInchSwapQuoteNoReject,
  avaUsd,
  heraSwapQuote,
  openOceanSwapQuote,
  jupiterSwapQuote,
};
