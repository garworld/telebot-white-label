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

//
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_ROUTER_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "router.json"))
  .toString();

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blocnNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * buyTokenUseETH(chainIdx, walletPK, tokenAddress, amount, slippage = "50")
 *
 * @param { number } chainIdx
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function buyTokenUseETH(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = "50",
  redis
) {
  return new Promise(async (resolve) => {
    try {
      // get chains
      const chainsCache = await redis.GET("chainsCache");
      const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

      // const chains = DATA_CHAIN_LIST;

      //
      const provider = new ethers.providers.JsonRpcProvider(
        chains[chainIdx].rpc_provider
      );
      const chainId = chains[chainIdx].chain_id;
      const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        provider
      );
      const wallet = new ethers.Wallet(walletPK, provider);
      const tokenDecimals = await getTokenDecimals(provider, tokenAddress);
      const token1 = new Token(chainId, tokenAddress, tokenDecimals); // USDC
      const token2 = WETH[token1.chainId];
      const pair = await Fetcher.fetchPairData(token1, token2, provider); // creating instances of a pair
      const route = new Route([pair], token2); // a fully specified path from input token to output token
      let amountIn = ethers.utils.parseEther(amount.toString()); // helper function to convert ETH to Wei

      // transfer platfrom fee to specific wallet
      const platformFee = Math.floor((amountIn * 1) / 100);
      const sendingEtherTx = {
        from: wallet.address,
        to: process.env.PLATFORM_WALLET,
        value: platformFee.toString(),
      };
      await wallet
        .sendTransaction(sendingEtherTx)
        .then((_transaction) => {
          // console.log("SUCCESS CREATE TRANSACTION: ", transaction);
          logger.info("SUCCESS CREATE TRANSACTION ON BUY");
        })
        .catch((e) => {
          // console.log("FAILED SENDING FEE: ", e);
          logger.error("FAILED SENDING FEE ON BUY: " + e.message);
        });
      amountIn = (amountIn - platformFee).toString(); // new amount to swap after platform deduction

      const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
      const trade = new Trade( // information necessary to create a swap transaction.
        route,
        new TokenAmount(token2, amountIn),
        TradeType.EXACT_INPUT
      );

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      const amountOutMinHex = ethers.BigNumber.from(
        amountOutMin.toString()
      ).toHexString();
      const path = [token2.address, token1.address]; // An array of token addresses
      const to = wallet.address; // should be a checksummed recipient address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      const value = trade.inputAmount.raw; // needs to be converted to e.g. hex
      const valueHex = ethers.BigNumber.from(value.toString()).toHexString(); // convert to hex string

      // console.log({
      //   value: +ethers.utils.formatEther(value.toString()),
      //   amountOutMin: +amountOutMin / 10 ** tokenDecimals,
      //   path,
      //   to,
      //   deadline,
      // });

      // Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
      const rawTxn =
        await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
          amountOutMinHex,
          path,
          to,
          deadline,
          {
            value: valueHex,
          }
        );

      // Returns a Promise which resolves to the transaction.
      let sendTxn = await wallet.sendTransaction(rawTxn);

      // console.log({ sendTxn });

      // Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
      let receipt = await sendTxn.wait();

      // Logs the information about the transaction it has been mined.
      if (receipt) {
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
        logger.error("BUY TOKEN USE ETH ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("BUY ERROR", e);
      logger.error("BUY TOKEN USE ETH ERROR: ");
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

module.exports = buyTokenUseETH;
