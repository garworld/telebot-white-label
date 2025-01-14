//
require("dotenv").config();

//
const { default: axios } = require("axios");
const fetch = require("node-fetch");
const { Web3 } = require("web3");

//
const apiHeraBaseUrl = () => `https://pathfindersdk.hera.finance`;
const logger = require("./logger");
const { DATA_CHAIN_LIST } = require("../constants/chains");
// const redis = require("./redis");

/**
 * getRpcUrl(chainId)
 *
 * @param { number } chainId
 * @returns { string }
 */
const getRpcUrl = (chainId) => {
  // get chains (hardcoded for now)
  // const chains = JSON.parse(await redis.GET("chainsCache"));
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  //
  switch (chainId) {
    case 1:
      // return
      return chains[chains.findIndex((x) => Number(x.chain_id) === chainId)]
        .rpc_provider;
    case 42161:
      return chains[chains.findIndex((x) => Number(x.chain_id) === chainId)]
        .rpc_provider;
    case 43114:
      return chains[chains.findIndex((x) => Number(x.chain_id) === chainId)]
        .rpc_provider;
    case 1088:
      return chains[chains.findIndex((x) => Number(x.chain_id) === chainId)]
        .rpc_provider;
  }
};

/**
 * apiRequestUrl(queryParams)
 *
 * @param { string } methodName
 * @param { string } queryParams
 * @returns { string }
 */
const apiHeraRequestUrl = (methodName, queryParams) => {
  return (
    apiHeraBaseUrl() +
    methodName +
    "?" +
    new URLSearchParams(queryParams).toString()
  );
};

/**
 * buildTxForApproveTradeWithRouter(tokenAddress, amount, chainId, walletAddress)
 *
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { number } chainId
 * @param { string } walletAddress
 * @returns { Promise<object | Error> }
 */
const buildHeraTxForApproveTradeWithRouter = (
  tokenAddress,
  amount,
  chainId,
  walletAddress
) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // console.log(`===== BUILD TX FOR APPROVE TRADE WITH ROUTER =====`);

      //
      const web3 = new Web3(getRpcUrl(chainId));
      const url = apiHeraRequestUrl("/allowance", {
        account: walletAddress,
        amount,
        tokenInAddress: tokenAddress,
      });

      //
      // console.log(`APPROVE TX URL: ${url}`);

      //
      const res = await fetch(url);
      const transaction = await res.json();

      //
      // console.log("TRANSACTION: ", transaction);

      // // note: remote try catch logs
      // try {
      //   console.log(`transaction: ${transaction}`);
      //   console.log(`transaction: ${JSON.stringify(transaction)}`);
      // } catch (e) {
      //   console.log(`error logging transaction: ${e}`);
      // }

      //
      const gasLimit = await web3.eth.estimateGas({
        ...transaction,
        from: walletAddress,
      });
      // console.log(`GAS LIMIT: ${gasLimit}`);

      resolve({
        ...transaction,
        gas: gasLimit,
      });
    } catch (e) {
      //
      logger.error(
        "BUILD TX FOR APPROVE TRADE WITH ROUTER ERROR: " + e.message
      );

      //
      reject(e);
    }
  });
};

/**
 * buildTxForSwap(swapParams, chainId)
 *
 * @param { object } swapParams
 * @returns { Promise<object | Error> }
 */
const buildHeraTxForSwap = (swapParams) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // console.log(`===== BUILD TX FOR SWAP =====`);

      //
      const url = apiHeraRequestUrl("/swap", { ...swapParams });
      // console.log(`SWAP TX URL: ${url}`);

      // fetch the swap transaction details from the API
      const res = await axios.get(url);

      //
      // console.log("RES.DATA: ", res.data);
      // console.log(`RES.DATA.TX: ${res.data.tx}`);
      // console.log(`RES.DATA.TOAMOUNT: ${res.data.toAmount}`);

      //
      resolve({ tx: res.data.tx, amount: res.data.toTokenAmount });
    } catch (e) {
      //
      logger.error("BUILD TX FOR SWAP ERROR: " + e.message);

      //
      reject(e);
    }
  });
};

module.exports = {
  apiHeraBaseUrl,
  apiHeraRequestUrl,
  buildHeraTxForApproveTradeWithRouter,
  buildHeraTxForSwap,
};
