//
require("dotenv").config();

//
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { wallet_number, activities } = require("@prisma/client");
const { Token } = require("@uniswap/sdk");
// const appRootPath = require("app-root-path");
const ethers = require("ethers");
// const fs = require("fs");
const { default: Moralis } = require("moralis");
// const path = require("path");
const roundTo = require("round-to");

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
 * swapToken1inch()
 *
 * @param { string | number } chainIdx
 * @param { string } walletPk
 * @param { string } fromToken
 * @param { string } toToken
 * @param { string } amount
 * @param { string } slippage
 * @param { boolean } isPrivate
 * @param { object } msg
 * @param { wallet_number | number } walletUsed
 * @param { Array } chains
 * @param { import("redis").RedisClientType } redis
 * @returns { Promise<TxResponse | null> }
 */
function swapToken1Inch(
  chainIdx,
  walletPk,
  fromToken,
  toToken,
  amount,
  slippage = "10",
  isPrivate = false,
  msg,
  walletUsed,
  chains,
  redis,
) {
  return new Promise(async (resolve) => {
    try {
      // identify wallet number
      let activeWallet = null;
      let platformFee = null;

      //
      switch (walletUsed) {
        case 1:
          activeWallet = wallet_number.FIRST;
          break;
        case 2:
          activeWallet = wallet_number.SECOND;
          break;
        case 3:
          activeWallet = wallet_number.THIRD;
          break;
        case wallet_number.FIRST:
          activeWallet = wallet_number.FIRST;
          break;
        case wallet_number.SECOND:
          activeWallet = wallet_number.SECOND;
          break;
        case wallet_number.THIRD:
          activeWallet = wallet_number.THIRD;
          break;
        default:
          activeWallet = wallet_number.FIRST;
      }

      //
      const provider = new ethers.providers.JsonRpcProvider(chains[chainIdx].rpc_provider);
      const chainId = chains[chainIdx].chain_id;
      const wallet = new ethers.Wallet(walletPk, provider);

      const selectedChain = {
        0: EvmChain.ETHEREUM,
        1: EvmChain.ARBITRUM,
        2: EvmChain.AVALANCHE,
        3: "metis-mainnet",
        4: "mainnet",
        5: EvmChain.BASE
      }[Number(chainIdx)];

      //
      console.log({ fromToken, toToken });
      const fromDecimals = (fromToken.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? 18 : await getTokenDecimals(provider, fromToken));
      const toDecimals = (toToken.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? 18 : await getTokenDecimals(provider, toToken));
      console.log({ fromDecimals, toDecimals });

      //
      const token1 = new Token(chainId, toToken, toDecimals); // token want to buy
      // console.log({ token1 });

      const token2 = new Token(chainId, fromToken, fromDecimals); // token swapped
      // console.log({ token2 });

      let amountIn = ethers.utils.parseUnits(amount.toString(), fromDecimals);
      // console.log({ amountIn });

      //
      if (fromToken.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        //
        const benefits = await userBenefit(msg);
        console.log({ benefits });

        // platformFee = amountIn.div(100).mul(benefits.tradingFee).mul(100).div(100);
        platformFee = amountIn.div(100).mul(roundTo(benefits.tradingFee * 100, 0)).div(100);
        amountIn = amountIn.sub(platformFee);
      }
      console.log({ amountIn });

      // const swapQuoteResp = await oneInchSwapQuoteNoReject(
      //   chainIdx,
      //   fromToken,
      //   toToken,
      //   amountIn
      // );

      const swapParams = {
        src: token2.address, // Token address of WETH
        dst: token1.address, // Token address of desired token
        amount: amountIn.toString(), // Amount of 1INCH to swap (in wei)
        from: wallet.address,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        disableEstimate: false, // Set to true to disable estimation of swap details
        allowPartialFill: false, // Set to true to allow partial filling of the swap order
      };

      //
      const transactionForSign = await buildTxForApproveTradeWithRouter(
        swapParams.src,
        amountIn.toString(),
        chainId,
        wallet.address
      );

      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      //
      const approveTxHash = await signAndSendTransaction(
        transactionForSign,
        wallet,
        chainId,
        isPrivate
      );

      // wait for transaction to complete
      await provider.waitForTransaction(approveTxHash);

      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const swapTransaction = await buildTxForSwap(swapParams, chainId);
      // console.log({ swapTransaction });

      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      //
      const swapTxHash = await signAndSendTransaction(
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

        if (platformFee) {
          // send fees from wallet to our platform wallet
          const sendingEtherTx = {
            from: wallet.address,
            to: process.env.PLATFORM_WALLET,
            value: platformFee,
          };

          const feeTx = await wallet.sendTransaction(sendingEtherTx);
          await feeTx.wait();
        }

        //
        const firstBuy = await checkFirst(msg.chat.id, activities.BUYTOKEN);
        if (firstBuy) {
          const thePoints = await getActivityPoint(activities.FIRSTBUYTOKEN);
          if (thePoints.point) await updatePoint(msg.chat.id, Number(thePoints.point));
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
          false
        );

        // save wallet tx to db
        const walletTxOpt = {
          chat_id: msg.chat.id,
          chain_id: chainId,
          wallet_number: activeWallet,
          activity: activities.BUYTOKEN,
        };
        await saveWalletTx(walletTxOpt);

        // add delay to resolve moralis
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let tokenBalance = 0;
        let amountInUsd = 0;

        const evmresponse = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          chain: selectedChain,
          address: dinfo?.address,
          excludeNative: true,
          excludeSpam: true,
        });
        // console.log({ response: evmresponse.hasNext() });
        
        if (evmresponse.result.length > 0) {
          let checkPorto = async (res) => {
            // console.log({ res });
            res.result.forEach((x) => {
              // console.log(x.usdValue);
              if (x.tokenAddress.toLowerCase() === toToken.toLowerCase()) {
                tokenBalance = x.balanceFormatted;
                amountInUsd = x.usdValue;
              }
            });

            if (res.hasNext()) {
              const nextResp = await res.next();
              await checkPorto(nextResp);
            }
          }

          //
          await checkPorto(evmresponse);
        }

        // harusnya token balance, jangan dari quote, kalo dr quote bisa > atau < dr jml k swap makanya initial pasti beda dan error aneh
        // get token balance
        // get usd price
        // amountToken = tokenBalance
        // amountMakersUsd = usdValue

        await upsertHodling(
          msg.chat.id, 
          chains[chainIdx].chain_id, 
          activeWallet, 
          toToken,
          tokenBalance,
          amountInUsd,
        )

        resolve({
          hash: swapTxHash,
          blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("SWAP TOKEN 1INCH ERROR");

        //
        resolve({
          hash: null,
          blockNumber: null,
          error: "Tx incomplete",
        });
      }
    } catch (e) {
      //
      logger.error("SWAP TOKEN 1INCH ERROR: ");
      logger.error(e);

      //
      if (e.error) {
        if (e.error.body) {
          //
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
          });
        } else {
          // resolve("FAILED TO BUY -");
          // console.log("e.error ", e.error);

          //
          const errMsg = e?.error?.error?.reason ?? "Unknown error, if the problem persist please contact support";

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

        //
        let errorMsg = e?.response?.data?.description ?? e?.response?.data?.message ?? "Unknown error, if the problem persist please contact support";
        
        //
        errorMsg = errorMsgCustomization(errorMsg);

        //
        resolve({
          hash: null,
          blockNumber: null,
          error: errorMsg,
        });
      }
    }
  });
}

module.exports = swapToken1Inch;
