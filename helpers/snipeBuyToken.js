// dotenv config
require("dotenv").config();

//
const {
  // ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Token,
  Percent,
} = require("@uniswap/sdk");
const appRootPath = require("app-root-path");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

//
const logger = require("./logger");
// const redis = require("./redis");
const { getTokenDecimals } = require("./tokenHelper");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { buildTxForSwap } = require("./1inch");
const { userBenefit } = require("./userBenefit");

//
const UNISWAP_V2_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_V2_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "uniswapv2.json"))
  .toString();

/**
 * @typedef { Object } TxResponse
 * @property { String | null } hash - The chain_name of moralis list
 * @property { Number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * buyTokenUseETH(chainIdx, walletPK, tokenInAddress, amount, slippage = "10000", tip, gasLimit, gasPrice, deadlineSec, redis)
 *
 * @param { number } chainIdx
 * @param { string } walletPK
 * @param { string } tokenInAddress
 * @param { string } tokenOutAddress
 * @param { string } amount
 * @param { string } slippage
 * @param { string } tip
 * @param { string } gasLimit
 * @param { string } gasPrice
 * @param { number } deadlineSec
 * @param { import("redis").RedisClientType } redis
 * @param { object } msg
 * @returns { Promise<TxResponse | null> }
 */
function snipeBuyToken(
  chainIdx,
  walletPK,
  tokenInAddress,
  tokenOutAddress,
  amount,
  slippage = "10000",
  gasLimit,
  gasPrice,
  deadlineSec,
  approval = false,
  redis,
  msg
) {
  return new Promise(async (resolve) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // const chains = DATA_CHAIN_LIST;

      //
      const provider = new ethers.providers.JsonRpcProvider(
        chains[chainIdx].rpc_provider
      );
      const chainId = chains[chainIdx].chain_id;
      const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
        UNISWAP_V2_ADDRESS,
        UNISWAP_V2_ABI,
        provider
      );
      const wallet = new ethers.Wallet(walletPK, provider);
      const tokenInDecimals = await getTokenDecimals(provider, tokenInAddress);
      const tokenOutDecimals = await getTokenDecimals(provider, tokenOutAddress);
      const tokenIn = new Token(chainId, tokenInAddress, tokenInDecimals); // Token 1
      const tokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals); // Token 2
      const pair = await Fetcher.fetchPairData(tokenIn, tokenOut, provider); // creating instances of a pair
      const route = new Route([pair], tokenIn); // a fully specified path from input token to output token
      // let amountIn = ethers.utils.parseEther(amount.toString()); // helper function to convert ETH to Wei
      let amountIn = ethers.utils.parseUnits(amount.toString(), +tokenInDecimals); // helper function to convert ETH to Wei
      
      const swapParams = {
        src: tokenIn.address, // Token address of desired token
        dst: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Token address of ETH
        amount: +amountIn.toString(), // Amount of 1INCH to swap (in wei)
        from: wallet.address,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        disableEstimate: false, // Set to true to disable estimation of swap details
        allowPartialFill: false, // Set to true to allow partial filling of the swap order
      };

      //
      // console.log(swapParams);

      //
      // const swapTransaction = await buildTxForSwap(swapParams, chainId);
      // const benefits = await userBenefit(msg);

      // note double check no decimals
      // const platformFee = amountIn.div(100);
      const platformFee = ethers.BigNumber.from(swapTransaction.amount)
        .mul(benefits.tradingFee * 100)
        .div(10000);
      // amountIn = amountIn.sub(platformFee);
      const amountInHex = ethers.BigNumber.from(
        +amountIn.toString()
      ).toHexString();

      const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
      const trade = new Trade( // information necessary to create a swap transaction.
        route,
        new TokenAmount(tokenIn, amountIn),
        TradeType.EXACT_INPUT
      );

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      const amountOutMinHex = ethers.BigNumber.from(
        amountOutMin.toString()
      ).toHexString();
      const path = [tokenIn.address, tokenOut.address]; // An array of token addresses
      const to = wallet.address; // should be a checksummed recipient address
      let deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      if (deadlineSec) deadline = Math.floor(Date.now() / 1000) + Number(deadlineSec);
      // const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      const value = trade.inputAmount.raw; // needs to be converted to e.g. hex
      const valueHex = ethers.BigNumber.from(value.toString()).toHexString(); // convert to hex string

      // console.log({
      //   value: +ethers.utils.formatEther(value.toString()),
      //   amountOutMin: +amountOutMin / 10 ** tokenInDecimals,
      //   path,
      //   to,
      //   deadline,
      // });

      // Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
      const rawTxn =
        await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactTokensForTokens(
          amountInHex,
          amountOutMinHex,
          path,
          to,
          deadline,
          {
            value: valueHex,
          }
        );

      rawTxn.gasLimit = gasLimit;
      rawTxn.gasPrice = gasPrice;

      // Returns a Promise which resolves to the transaction.
      let sendTxn = await wallet.sendTransaction(rawTxn);

      // const sendingEtherTx = {
      //   from: wallet.address,
      //   to: process.env.PLATFORM_WALLET,
      //   value: platformFee.toString(),
      // };
      // await wallet
      //   .sendTransaction(sendingEtherTx)
      //   .then((_transaction) => {
      //     // console.log("SUCCESS CREATE TRANSACTION: ", transaction);
      //     logger.info("SUCCESS CREATE TRANSACTION ON SNIPE BUY");
      //   })
      //   .catch((e) => {
      //     // console.log("FAILED SENDING FEE: ", e);
      //     logger.error("FAILED SENDING FEE ON SNIPE BUY: " + e.message);
      //   });

      // console.log({ sendTxn });

      // Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
      let receipt = await sendTxn.wait();

      // Logs the information about the transaction it has been mined.
      if (receipt) {
        if (approval) {
          const transactionForSign = await buildTxForApproveTradeWithRouter(
            tokenIn.address,
            amountOutMin,
            chainId,
            wallet.address
          );
    
          // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const approveTxHash = await signAndSendTransaction(
            transactionForSign,
            wallet,
            chainId,
            false
          );
    
          // wait for transaction to complete
          await provider.waitForTransaction(approveTxHash);
        }

        const hash = sendTxn.hash;
        const blockNumber = receipt.blockNumber;

        // //
        // console.log(
        //   " - Transaction is mined - " +
        //     "\n" +
        //     "Transaction Hash:" +
        //     hash +
        //     "\n" +
        //     "Block Number: " +
        //     blockNumber +
        //     "\n" +
        //     "Navigate to https://etherscan.io/txn/" +
        //     hash,
        //   "to see your transaction"
        // );

        //
        logger.debug({
          hash,
          blockNumber,
        });

        //
        resolve({
          hash,
          blockNumber,
          error: null,
        });

        // //
        // resolve(
        //   " - Transaction is mined - " +
        //     "\n" +
        //     "Transaction Hash:" +
        //     hash +
        //     "\n" +
        //     "Block Number: " +
        //     blockNumber +
        //     "\n" +
        //     "Navigate to https://etherscan.io/txn/" +
        //     hash,
        //   "to see your transaction"
        // );
      } else {
        // // error logging
        // console.error(new Error("Error submitting transaction"));
        logger.error("SNIPE BUY TOKEN ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("BUY ERROR", e);
      logger.error("SNIPE BUY TOKEN ERROR: ");
      logger.error(e);

      //
      if (e.error) {
        if (e.error.body) {
          // resolve(
          //   "FAILED TO BUY: " + JSON.stringify(JSON.parse(e.error.body).error)
          // );
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
          });
        } else {
          // resolve("FAILED TO BUY -");
          resolve(null);
        }
      } else {
        // resolve("FAILED TO BUY .");
        resolve(null);
      }
      // console.error(e.code);
      // console.error(e.error.body);
      // resolve("FAILED TO BUY: " + JSON.stringify(JSON.parse(e.error.body).error, null, 2));
    }
  });
}

module.exports = snipeBuyToken;
