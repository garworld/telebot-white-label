//
require("dotenv").config();

//
const { default: axios } = require("axios");
const fetch = require("node-fetch");
const { Web3 } = require("web3");

//
const broadcastApiUrl = (chainId) =>
  `https://api.1inch.dev/tx-gateway/v1.1/${chainId}/broadcast`;
const apiBaseUrl = (chainId) => `https://api.1inch.dev/swap/v5.2/${chainId}`;
const logger = require("./logger");
const { DATA_CHAIN_LIST } = require("../constants/chains");
// const redis = require("./redis");

//
const headers = {
  headers: {
    Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
    accept: "application/json",
  },
};

/**
 * getRpcUrl(chainId)
 *
 * @param { number } chainId
 * @returns { string }
 */
const getRpcUrl = (chainId) => {
  // get chains (hardcoded for now)
  // const chains = JSON.parse(await redis.GET("chainsCache"));
  // const chains = DATA_CHAIN_LIST;
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
    case 8453:
      return chains[chains.findIndex((x) => Number(x.chain_id) === chainId)]
        .rpc_provider;
  }
};

/**
 * apiRequestUrl(methodName, queryParams, chainId)
 *
 * @param { string } methodName
 * @param { string } queryParams
 * @param { number } chainId
 * @returns { string }
 */
const apiRequestUrl = (methodName, queryParams, chainId) => {
  return (
    apiBaseUrl(chainId) +
    methodName +
    "?" +
    new URLSearchParams(queryParams).toString()
  );
};

/**
 * broadCastRawTransaction(rawTransaction, chainId)
 *
 * Post raw transaction to the API and return transaction hash
 *
 * @param { object } rawTransaction
 * @param { number } chainId
 * @returns { Promise<string | Error> }
 */
const broadCastRawTransaction = (rawTransaction, chainId) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const configs = {
        headers: {
          Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
          "Content-Type": "application/json",
        },
      };

      //
      // console.log(`BROADCAST API URL: ${broadcastApiUrl}`);

      //
      const response = await axios.post(
        broadcastApiUrl(chainId),
        { rawTransaction },
        configs
      );

      //
      resolve(response.data?.transactionHash);
    } catch (e) {
      // console.log(`broadCastRawTransaction error: ${e}`);
      logger.error("BROADCAST RAW TRANSACTION ERROR: " + e.message);

      //
      reject(e);
    }
  });
};

/**
 * signAndSendTransaction(transaction, wallet, chainId)
 *
 * sign and post a transaction, return its hash
 *
 * @param { object } transaction
 * @param { string } wallet
 * @param { number } chainId
 * @returns { Promise<string | Error> }
 */
const signAndSendTransaction = (
  transaction,
  wallet,
  chainId,
  isPrivate = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let web3 = new Web3(getRpcUrl(chainId));

      if (isPrivate && chainId == 1) {
        web3 = new Web3("https://rabbithole.1inch.io/1");
      }

      //
      // console.log({ transaction, wallet, chainId });

      transaction.from = wallet.address;
      const { rawTransaction } = await web3.eth.accounts.signTransaction(
        transaction,
        wallet.privateKey
      );

      // console.log("RAW TRANSACTION: ", { rawTransaction });

      const broadcasted = await broadCastRawTransaction(
        rawTransaction,
        chainId
      );

      resolve(broadcasted);
    } catch (e) {
      //
      logger.error("SIGN AND SEND TRANSACTION ERROR: " + e.message);

      //
      reject(e);
    }
  });
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
const buildTxForApproveTradeWithRouter = (
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
      const url = apiRequestUrl(
        "/approve/transaction",
        amount ? { tokenAddress, amount } : { tokenAddress },
        chainId
      );

      //
      // console.log(`APPROVE TX URL: ${url}`);

      //
      const res = await fetch(url, headers);
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
 * @param { number } chainId
 * @returns { Promise<object | Error> }
 */
const buildTxForSwap = (swapParams, chainId) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // console.log(`===== BUILD TX FOR SWAP =====`);

      //
      const url = apiRequestUrl(
        "/swap",
        { ...swapParams, compatibility: true },
        chainId
      );
      // console.log(`SWAP TX URL: ${url}`);

      // fetch the swap transaction details from the API
      const res = await axios.get(url, headers);

      //
      // console.log(`RES.DATA.TX: ${res.data.tx}`);
      // console.log(`RES.DATA.TOAMOUNT: ${res.data.toAmount}`);

      //
      resolve({ tx: res.data.tx, amount: res.data.toAmount });
    } catch (e) {
      //
      logger.error("BUILD TX FOR SWAP ERROR: " + e.message);

      //
      reject(e);
    }
  });
};

module.exports = {
  broadcastApiUrl,
  apiBaseUrl,
  apiRequestUrl,
  broadCastRawTransaction,
  signAndSendTransaction,
  buildTxForApproveTradeWithRouter,
  buildTxForSwap,
};
