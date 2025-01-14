//
require("dotenv").config();

//
const { wallet_number, activities } = require("@prisma/client");
const { Token } = require("@uniswap/sdk");
// const appRootPath = require("app-root-path");
const ethers = require("ethers");
// const fs = require("fs");
// const path = require("path");

//
const {
  // buildTxForApproveTradeWithRouter,
  buildTxForSwap,
  signAndSendTransaction,
  buildTxForApproveTradeWithRouter,
} = require("./1inch");
const logger = require("./logger");
// const redis = require("./redis");
const { getAllowanceAmount, getTokenDecimals } = require("./tokenHelper");
const errorMsgCustomization = require("./errorMsgCustomization");
const { finalPointMultiplier } = require("./finalPointMultiplier");
const checkFirst = require("../databases/checkFirst");
const getActivityPoint = require("../databases/getActivityPoint");
const updatePoint = require("../databases/updatePoint");
const { userBenefit } = require("./userBenefit");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const saveWalletTx = require("../databases/saveWalletTx");
const upsertHodling = require("../databases/upsertHodling");
const { oneInchSwapQuoteNoReject } = require("./tokenPrice");
const dexGetUsdPrice = require("./dexScreener");
// const redis = require("./redis");

// const ONE_INCH_ROUTER_ADDRESS = "0x1111111254eeb25477b68fb85ed929f73a960582";

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * buyTokenUseETH(walletPK, tokenAddress, amount, slippage = "50")
 *
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function buyTokenUseETH1Inch(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = "10",
  isPrivate = false,
  msg,
  walletUsed,
  chains,
  redis,
  buyTokenAddress = null
) {
  return new Promise(async (resolve) => {
    try {
      // // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

      // identify wallet number
      let activeWallet;
      if (walletUsed == 1) {
        activeWallet = wallet_number.FIRST;
      } else if (walletUsed == 2) {
        activeWallet = wallet_number.SECOND;
      } else if (walletUsed == 3) {
        activeWallet = wallet_number.THIRD;
      }

      //
      const provider = new ethers.providers.JsonRpcProvider(
        chains[chainIdx].rpc_provider
      );
      const chainId = chains[chainIdx].chain_id;
      const wallet = new ethers.Wallet(walletPK, provider);
      const tokenDecimals = await getTokenDecimals(provider, tokenAddress);
      // console.log({ tokenDecimals });
      let buyTokenDecimals = buyTokenAddress
        ? await getTokenDecimals(provider, buyTokenAddress)
        : 18;
      // console.log({ buyTokenDecimals });

      //
      const token1 = new Token(chainId, tokenAddress, tokenDecimals); // token want to buy
      // console.log({ token1 });
      let token2 = buyTokenAddress
        ? new Token(chainId, buyTokenAddress, buyTokenDecimals)
        : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // native token on 1inch api
      // console.log({ token2 });

      let amountIn = ethers.utils.parseUnits(
        amount.toString(),
        buyTokenDecimals
      );

      const swapQuoteResp = await oneInchSwapQuoteNoReject(
        chainIdx,
        buyTokenAddress || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        tokenAddress,
        amountIn
      );

      // console.log({ amountIn });

      // note double check no decimals
      const platformFee = amountIn.div(100);
      // console.log({ platformFee });

      if (!buyTokenAddress) {
        amountIn = amountIn.sub(platformFee);
      }
      const swapParams = {
        src: buyTokenAddress ? token2.address : token2, // Token address of WETH
        dst: token1.address, // Token address of desired token
        amount: amountIn, // Amount of 1INCH to swap (in wei)
        from: wallet.address,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        disableEstimate: false, // Set to true to disable estimation of swap details
        allowPartialFill: false, // Set to true to allow partial filling of the swap order
      };

      if (buyTokenAddress) {
        const transactionForSign = await buildTxForApproveTradeWithRouter(
          swapParams.src,
          amountIn,
          chainId,
          wallet.address
        );

        // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const approveTxHash = await signAndSendTransaction(
          transactionForSign,
          wallet,
          chainId,
          isPrivate
        );

        // wait for transaction to complete
        await provider.waitForTransaction(approveTxHash);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const swapTransaction = await buildTxForSwap(swapParams, chainId);

      // console.log({ swapTransaction });
      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      swapTxHash = await signAndSendTransaction(
        swapTransaction.tx,
        wallet,
        chainId,
        isPrivate
      );
      // console.log({ swapTxHash });

      const txComplete = await provider.waitForTransaction(swapTxHash);

      // console.log({ txComplete });

      // once the swap transaction is complete
      if (txComplete) {
        // const hash = sendTxHash;
        // note fix - can get it from "txComplete"
        const blockNumber = txComplete.blockNumber;

        //
        const benefits = await userBenefit(msg);

        if (!buyTokenAddress) {
          // send fees from wallet to our platform wallet
          const sendingEtherTx = {
            from: wallet.address,
            to: process.env.PLATFORM_WALLET,
            value: platformFee.mul(benefits.tradingFee * 100).div(100),
          };

          const feeTx = await wallet.sendTransaction(sendingEtherTx);
          await feeTx.wait();
        }

        const firstBuy = await checkFirst(msg.chat.id, activities.BUYTOKEN);
        if (firstBuy) {
          const thePoints = await getActivityPoint(activities.FIRSTBUYTOKEN);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }

        await finalPointMultiplier(
          msg.chat.id,
          activeWallet,
          activities.BUYTOKEN,
          amount,
          chains[chainIdx].chain_id,
          wallet.address,
          msg,
          redis,
          buyTokenAddress ? true : false
        );

        const tokenUsdPrice = await dexGetUsdPrice(tokenAddress) || 0;
        const amountInUsd = Number(ethers.utils.formatUnits(swapQuoteResp.toAmount, Number(tokenDecimals)).toString()) * Number(tokenUsdPrice);

        await upsertHodling(
          msg.chat.id, 
          chains[chainIdx].chain_id, 
          activeWallet, 
          tokenAddress,
          Number(ethers.utils.formatUnits(swapQuoteResp.toAmount, Number(tokenDecimals)).toString()),
          amountInUsd,
        )

        // save wallet tx to db
        const walletTxOpt = {
          chat_id: msg.chat.id,
          chain_id: chainId,
          wallet_number: activeWallet,
          activity: activities.BUYTOKEN,
        };
        await saveWalletTx(walletTxOpt);

        // console.log("test", checkFunc);

        resolve({
          hash: swapTxHash,
          blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("BUY TOKEN USE ETH 1INCH ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      //
      logger.error("BUY TOKEN USE ETH 1INCH ERROR: ");
      logger.error(e);

      //
      if (e.error) {
        if (e.error.body) {
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
          });
        } else {
          // resolve("FAILED TO BUY -");
          // console.log("e.error ", e.error);
          const errMsg =
            e?.error?.error?.reason ??
            "Unknown error, if the problem persist please contact support";

          //
          resolve({
            hash: null,
            blockNumber: null,
            error: errMsg,
          });
        }
      } else {
        // resolve("FAILED TO BUY .");
        // Failed due to axios request failing
        // console.log("ERROR", e.response.data);
        let errorMsg =
          e?.response?.data?.description ??
          e?.response?.data?.message ??
          "Unknown error, if the problem persist please contact support";
        //
        errorMsg = errorMsgCustomization(errorMsg);
        resolve({
          hash: null,
          blockNumber: null,
          error: errorMsg,
        });
      }
    }
  });
}

module.exports = buyTokenUseETH1Inch;
