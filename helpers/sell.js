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
const redis = require("./redis");
const { getTokenDecimals, getAllowanceAmount } = require("./tokenHelper");
const { DATA_CHAIN_LIST } = require("../constants/chains");

//
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_ROUTER_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "router.json"))
  .toString();
const ERC20_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * sellTokenForETH(chainIdx, walletPK, tokenAddress, amount, slippage = "50")
 *
 * @param { number } chainIdx
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function sellTokenForETH(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = "20"
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
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        provider
      );
      const wallet = new ethers.Wallet(walletPK, provider);
      const tokenDecimals = await getTokenDecimals(provider, tokenAddress);
      const allowance = await getAllowanceAmount(
        provider,
        tokenAddress,
        wallet.address,
        UNISWAP_ROUTER_ADDRESS
      );

      const token2 = new Token(chainId, tokenAddress, tokenDecimals); // USDC
      const token1 = WETH[token2.chainId];
      const pair = await Fetcher.fetchPairData(token1, token2, provider); //creating instances of a pair
      const route = new Route([pair], token2); // a fully specified path from input token to output token
      let amountIn = amount * 10 ** tokenDecimals; // helper function to convert ETH to Wei
      // let amountIn = amount; // helper function to convert ETH to Wei
      // console.log("AMOUNT IN DECIMALS OK: ", amountIn.toLocaleString('fullwide', { useGrouping: false }));

      if (allowance < amountIn) {
        // const ERC20_ABI = fs.readFileSync("./abis/erc20.json").toString();
        // const ERC20_ABI = fs
        // .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
        // .toString();

        // console.log("ALLOWANCE < AMOUNT IN");
        const ERC20_CONTRACT = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          wallet
        );
        // console.log("ERC20 CONTRACT OK");

        let increase = amountIn - allowance;
        // console.log("INCREASE OK: ", increase.toLocaleString('fullwide', { useGrouping: false }));
        const hexIncrease = ethers.BigNumber.from(
          increase.toLocaleString("fullwide", { useGrouping: false })
        ).toHexString();
        // console.log("UNISWAP ROUTER ADDRESS: ", UNISWAP_ROUTER_ADDRESS);
        const tx = await ERC20_CONTRACT.populateTransaction.approve(
          UNISWAP_ROUTER_ADDRESS,
          // +increase.toString()
          hexIncrease
          // {
          //   gasLimit: 100000,
          // }
        );
        // console.log("TX INCREASE ALLOWANCE OK: ", tx);
        // Returns a Promise which resolves to the transaction.
        let sendTxn = await wallet.sendTransaction(tx);

        // console.log({ sendTxn });

        await sendTxn.wait(1);
        // console.log("SEND TXN INCREASE ALLOWANCE OK");
      }
      // amountIn = amountIn.toString();
      amountIn = amountIn.toLocaleString("fullwide", { useGrouping: false });
      // console.log("AMOUNT IN OK: ", amountIn);

      const slippageTolerance = new Percent(slippage, "100"); // 50 bips, or 0.50% - Slippage tolerance
      // console.log("SLIPPAGE TOLERANCE OK");

      const trade = new Trade( // information necessary to create a swap transaction.
        route,
        new TokenAmount(token2, amountIn),
        TradeType.EXACT_INPUT
      );
      // console.log("TRADE OK");

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      // console.log("AMOUNT OUT MIN OK");
      const amountOutMinHex = ethers.BigNumber.from(
        amountOutMin.toString()
      ).toHexString();
      // console.log("AMOUNT OUT MIN HEX OK");
      const path = [token2.address, token1.address]; // An array of token addresses
      const to = wallet.address; // should be a checksummed recipient address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 20 minutes from the current Unix time
      const value = trade.inputAmount.raw; // needs to be converted to e.g. hex
      // console.log("VALUE OK");
      const valueHex = ethers.BigNumber.from(value.toString()).toHexString(); // convert to hex string
      // console.log("VALUE HEX OK");

      // Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
      const rawTxn =
        await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
          valueHex,
          amountOutMinHex,
          path,
          to,
          deadline,
          {
            gasLimit: ethers.BigNumber.from((3000000).toString()).toHexString(),
          }
        );
      // Returns a Promise which resolves to the transaction.
      // console.log("RAW TXN: ", rawTxn);
      let sendTxn = await wallet.sendTransaction(rawTxn);

      // Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
      let receipt = await sendTxn.wait();

      // Logs the information about the transaction it has been mined.
      if (receipt) {
        const hash = sendTxn.hash;
        const blockNumber = receipt.blockNumber;
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

        // transfer platfrom fee to specific wallet
        const platformFee = Math.floor((+amountOutMin * 1) / 100);
        const sendingEtherTx = {
          from: wallet.address,
          to: process.env.PLATFORM_WALLET,
          value: platformFee.toString(),
        };
        await wallet
          .sendTransaction(sendingEtherTx)
          .then((_transaction) => {
            // console.log("SUCCESS CREATE TRANSACTION: ", transaction);
            logger.info("SUCCESS CREATE TRANSACTION ON SELL");
          })
          .catch((e) => {
            // console.log("FAILED SENDING FEE: ", e);
            logger.error("FAILED SENDING FEE ON SELL: " + e.message);
          });

        //
        resolve({
          hash,
          blockNumber,
          error: null,
        });

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
        // //
        // console.error(new Error("Error submitting transaction"));
        logger.error("SELL TOKEN ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("SELL TOKEN ERROR", e);
      logger.error("SELL TOKEN ERROR: ");
      logger.error(e);

      //
      if (e.error) {
        if (e.error.body) {
          // resolve("FAILED TO SELL TOKEN: " + JSON.stringify(JSON.parse(e.error.body).error));
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
          });
        } else {
          // resolve("FAILED TO SELL TOKEN -");
          resolve(null);
        }
      } else {
        // resolve("FAILED TO SELL TOKEN .");
        resolve(null);
      }
      // return new Error("Error submitting transaction");
      // console.error(e.error.body);
      // resolve("FAILED TO SELL: " + JSON.stringify(JSON.parse(e.error.body).error, null, 2));
    }
  });
}

module.exports = sellTokenForETH;
