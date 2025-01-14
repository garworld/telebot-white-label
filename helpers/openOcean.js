const { Web3 } = require("web3");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const logger = require("./logger");
const { default: axios } = require("axios");

const apiOpenOceanBaseUrl = () => `https://open-api.openocean.finance`;

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
const apiOpenOceanRequestUrl = (methodName, queryParams) => {
  return (
    apiOpenOceanBaseUrl() +
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
const buildOpenOceanTxForApproveTradeWithRouter = (
  tokenAddress,
  amount,
  chainId,
  walletAddress
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log({ tokenAddress, amount, chainId, walletAddress });
      //
      // console.log(`===== BUILD TX FOR APPROVE TRADE WITH ROUTER =====`);
      let contractAddress;
      switch (chainId) {
        case 1088:
          contractAddress = "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64";
          break;
      }

      //
      const rpcUrl = getRpcUrl(chainId);
      const web3 = new Web3(rpcUrl);
      const url = apiOpenOceanRequestUrl("/v1/cross/getAllowance", {
        account: walletAddress,
        chainId: chainId,
        inTokenAddress: tokenAddress,
        contractAddress,
      });

      //
      // console.log(`APPROVE TX URL: ${url}`);

      //
      const res = await fetch(url);
      // console.log({ res });
      //   const transaction = await res.json();
      //   console.log({ transaction });

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
        from: walletAddress,
        ...res.data,
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
const buildOpenOceanTxForSwap = (swapParams, chainId) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // console.log(`===== BUILD TX FOR SWAP =====`);

      //
      let chain_code;
      switch (chainId) {
        case 1088:
          chain_code = "metis";
          break;
      }

      //
      const url = apiOpenOceanRequestUrl(`/v3/${chain_code}/swap_quote`, {
        ...swapParams,
      });
      // console.log(`SWAP TX URL: ${url}`);

      // fetch the swap transaction details from the API
      const res = await axios.get(url);

      //
      // console.log("RES.DATA: ", res.data);
      // console.log(`RES.DATA.TX: ${res.data.tx}`);
      // console.log(`RES.DATA.TOAMOUNT: ${res.data.toAmount}`);

      //
      resolve(res.data.data);
    } catch (e) {
      //
      logger.error("BUILD TX FOR SWAP ERROR: " + e.message);

      //
      reject(e);
    }
  });
};

const getChainGasPrice = (chainId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let chain_code;
      switch (chainId) {
        case 1088:
          chain_code = "metis";
          break;
      }
      const gasUrl = `https://open-api.openocean.finance/v3/${chain_code}/gasPrice`;

      //
      const res = await axios.get(gasUrl);

      resolve(res.data?.without_decimals?.standard);
    } catch (e) {
      //
      logger.error("GET PRICE OPEN OCEAN ERROR: " + e.message);
      //
      reject(e);
    }
  });
};

module.exports = {
  apiOpenOceanBaseUrl,
  apiOpenOceanRequestUrl,
  buildOpenOceanTxForApproveTradeWithRouter,
  buildOpenOceanTxForSwap,
  getChainGasPrice,
};
