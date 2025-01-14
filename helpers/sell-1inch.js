//
require("dotenv").config();

//
const { wallet_number, activities } = require("@prisma/client");
const { Token } = require("@uniswap/sdk");
const checkFirst = require("../databases/checkFirst");
// const appRootPath = require("app-root-path");
const ethers = require("ethers");
// const fs = require("fs");
// const path = require("path");

//
const { getAllowanceAmount, getTokenDecimals } = require("./tokenHelper");
const logger = require("./logger");
// const redis = require("./redis");
const {
  buildTxForApproveTradeWithRouter,
  buildTxForSwap,
  signAndSendTransaction,
} = require("./1inch");
const { finalPointMultiplier } = require("./finalPointMultiplier");
const getActivityPoint = require("../databases/getActivityPoint");
const updatePoint = require("../databases/updatePoint");
const { userBenefit } = require("./userBenefit");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const saveWalletTx = require("../databases/saveWalletTx");
const upsertHodling = require("../databases/upsertHodling");
const dexGetUsdPrice = require("./dexScreener");

const ONE_INCH_ROUTER_ADDRESS = "0x1111111254eeb25477b68fb85ed929f73a960582";

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 *
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function sellTokenForETH1Inch(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = "10",
  isPrivate = false,
  msg,
  walletUsed,
  redis,
  sellTokenAddress = null
) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // console.log("STARTING SELL...");
      // console.log(`AMOUNT: ${amount}`);
      // console.log(`AMOUNT type: ${typeof amount}`);

      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // const chains = DATA_CHAIN_LIST;

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
      let tokenSellDecimals = null;
      if (sellTokenAddress) {
        tokenSellDecimals = await getTokenDecimals(provider, sellTokenAddress);
        // console.log({ tokenSellDecimals });
      }

      //
      const token2 = new Token(chainId, tokenAddress, tokenDecimals); // Address want to sell
      let token1 = sellTokenAddress
        ? new Token(chainId, sellTokenAddress, tokenSellDecimals)
        : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      let splitAmount = amount.split(".");

      let formattedAmount = amount;
      // console.log("TOKEN DECIMALS: ", tokenDecimals);
      // console.log("TOKEN DECIMALS TYPE: ", typeof tokenDecimals);
      // 0,00016
      if (splitAmount && splitAmount[0] === undefined) {
        splitAmount[0] = "0";
      } else if (splitAmount[1] && splitAmount[1]?.length > tokenDecimals) {
        formattedAmount = `${splitAmount[0]}.${splitAmount[1].slice(
          0,
          tokenDecimals
        )}`;
      }
      // console.log(`FORMATTED AMOUNT: ${formattedAmount}`);

      let amountIn = ethers.utils.parseUnits(formattedAmount, tokenDecimals);
      // console.log("AMOUNT IN: ", amountIn);

      const swapParams = {
        src: token2.address, // Token address of desired token
        dst: sellTokenAddress ? token1.address : token1, // Token address of WETH
        amount: amountIn, // Amount of 1INCH to swap (in wei)
        from: wallet.address,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        disableEstimate: false, // Set to true to disable estimation of swap details
        allowPartialFill: false, // Set to true to allow partial filling of the swap order
      };
      // console.log(swapParams);

      //
      // console.log(`(ALLOWANCE < AMOUNT IN): ${allowance < amountIn}`);
      // console.log(`AMOUNT IN: ${amountIn}`);
      // console.log(`AMOUNT IN TYPE: ${typeof amountIn}`);
      // console.log(`ALLOWANCE: ${allowance}`);
      // console.log(`ALLOWANCE TYPE: ${typeof allowance}`);
      // console.log(`TOKEN ADDRESS: ${tokenAddress}`);
      // console.log(`ONE_INCH_ROUTER_ADDRESS: ${ONE_INCH_ROUTER_ADDRESS}`);

      // console.log("MASUK SINI");
      const transactionForSign = await buildTxForApproveTradeWithRouter(
        swapParams.src,
        amountIn,
        chainId,
        wallet.address
      );
      // console.log({ transactionForSign });

      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const approveTxHash = await signAndSendTransaction(
        transactionForSign,
        wallet,
        chainId,
        isPrivate
      );
      // console.log({ approveTxHash });

      // wait for transaction to complete
      await provider.waitForTransaction(approveTxHash);
      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const swapTransaction = await buildTxForSwap(swapParams, chainId);
      // console.log({ swapTransaction });
      const benefits = await userBenefit(msg);

      const platformFee = ethers.BigNumber.from(swapTransaction.amount)
        .mul(benefits.tradingFee * 100)
        .div(10000);

      // 1inch api sometimes requires time between their transactions due to rate limiting. wait 1 second before continuing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      swapTransaction.tx.from = wallet.address;
      const swapTxHash = await signAndSendTransaction(
        swapTransaction.tx,
        wallet,
        chainId
      );
      // console.log({ swapTxHash });

      const txComplete = await provider.waitForTransaction(swapTxHash);
      // console.log({ txComplete });

      if (txComplete) {
        const blockNumber = txComplete.blockNumber;

        //
        if (!sellTokenAddress) {
          // send fees from wallet to our platform wallet
          const sendingEtherTx = {
            from: wallet.address,
            to: process.env.PLATFORM_WALLET,
            value: platformFee,
          };

          const feeTx = await wallet.sendTransaction(sendingEtherTx);
          await feeTx.wait();
        }
        const firstSell = await checkFirst(msg.chat.id, activities.SELLTOKEN);
        if (firstSell) {
          const thePoints = await getActivityPoint(activities.FIRSTSELLTOKEN);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }

        const humanReadableAmount = ethers.utils.formatEther(
          swapTransaction.amount
        );

        // console.log({ humanReadableAmount });
        await finalPointMultiplier(
          msg.chat.id,
          activeWallet,
          activities.SELLTOKEN,
          Number(humanReadableAmount),
          chains[chainIdx].chain_id,
          wallet.address,
          msg,
          redis,
          sellTokenAddress ? true : false
        );

        const tokenUsdPrice = await dexGetUsdPrice(tokenAddress) || 0;
        const amountInUsd = Number(ethers.utils.formatUnits(amountIn, Number(tokenDecimals)).toString()) * Number(tokenUsdPrice);

        await upsertHodling(
          msg.chat.id, 
          chains[chainIdx].chain_id, 
          activeWallet, 
          tokenAddress,
          -1 * Number(ethers.utils.formatUnits(amountIn, Number(tokenDecimals)).toString()),
          -1 * amountInUsd,
        )

        const walletTxOpt = {
          chat_id: msg.chat.id,
          chain_id: chainId,
          wallet_number: activeWallet,
          activity: activities.SELLTOKEN,
        };
        const saveTx = await saveWalletTx(walletTxOpt);

        // console.log({ saveTx });

        resolve({
          hash: swapTxHash,
          blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("SELL TOKEN 1INCH ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      logger.error("SELL TOKEN 1INCH ERROR: ");
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
          resolve(null);
        }
      } else {
        reject(e);
      }
    }
  });
}

module.exports = sellTokenForETH1Inch;
