//
require("dotenv").config();

//
const { wallet_number, activities } = require("@prisma/client");
const { Token } = require("@uniswap/sdk");
const checkFirst = require("../databases/checkFirst");
const appRootPath = require("app-root-path");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

//
const { getAllowanceAmount, getTokenDecimals } = require("./tokenHelper");
const logger = require("./logger");
const redis = require("./redis");
const { buildHeraTxForSwap } = require("./hera");
const { finalPointMultiplier } = require("./finalPointMultiplier");
const getActivityPoint = require("../databases/getActivityPoint");
const updatePoint = require("../databases/updatePoint");
const { userBenefit } = require("./userBenefit");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { buildOpenOceanTxForSwap, getChainGasPrice } = require("./openOcean");
const erc20abi = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();
const saveWalletTx = require("../databases/saveWalletTx");

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
function sellTokenOpenOcean(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = "1",
  isPrivate = false,
  msg,
  walletUsed,
  redis,
  sellTokenAddress = null,
  deadline = 10 * 3600
) {
  return new Promise(async (resolve, reject) => {
    try {
      const openOceanRouter = "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64";

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
      let tokenSellDecimals = 18;
      if (sellTokenAddress) {
        tokenSellDecimals = await getTokenDecimals(provider, sellTokenAddress);
      }

      //
      const tokenSell = new Token(chainId, tokenAddress, tokenDecimals); // Address want to sell
      // console.log({ tokenSell });
      let tokenReceived = sellTokenAddress
        ? new Token(chainId, sellTokenAddress, tokenSellDecimals)
        : "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";

      //
      // console.log({ amount, tokenSellDecimals });
      let splitAmount = amount.split(".");
      let formattedAmount = amount;
      if (splitAmount && splitAmount[0] === undefined) {
        splitAmount[0] = "0";
      } else if (splitAmount[1] && splitAmount[1]?.length > tokenSellDecimals) {
        formattedAmount = `${splitAmount[0]}.${splitAmount[1].slice(
          0,
          tokenSellDecimals
        )}`;
      }
      let amountIn = ethers.utils.parseUnits(formattedAmount, tokenDecimals);
      // console.log({ amountIn });

      // approve tx
      const tokenSellContract = new ethers.Contract(
        tokenSell.address,
        erc20abi,
        wallet
      );

      const approveTx = await tokenSellContract.approve(
        openOceanRouter,
        amountIn
      );

      // console.log({ approveTx });

      await approveTx.wait(1);

      // SWAP PROCCESS

      // gas price
      //   const gasUrl = "https://open-api.openocean.finance/v3/metis/gasPrice";
      //   const res = await axios.get(gasUrl);
      const gasPrice = await getChainGasPrice(chainId);

      // console.log({ gasPrice });

      let amountInForParam = +amountIn / 10 ** tokenDecimals;

      const swapParams = {
        outTokenAddress: sellTokenAddress
          ? tokenReceived.address
          : tokenReceived,
        inTokenAddress: tokenSell.address,
        amount: amountInForParam,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        gasPrice,
        account: wallet.address,
        // deadline,
      };

      const swapTransaction = await buildOpenOceanTxForSwap(
        swapParams,
        chainId
      );

      // console.log({ swapTransaction });

      const { data, outAmount, estimatedGas } = swapTransaction;

      const transaction = {
        from: wallet.address,
        to: openOceanRouter,
        // gasLimit: estimatedGas,
        // gasPrice: +gas,
        data,
      };

      // 1 sec buffer to api
      await new Promise((resolve) => setTimeout(resolve, 1000));

      //sending transacation
      const sendTxn = await wallet.sendTransaction(transaction);

      // console.log({ sendTxn });

      // wait transaction to complete
      let txComplete = await sendTxn.wait();

      // console.log({ txComplete });

      if (txComplete) {
        const blockNumber = txComplete.blockNumber;

        const benefits = await userBenefit(msg);

        // console.log({ benefits });
        // console.log({ outAmount });

        const platformFee = ethers.BigNumber.from(outAmount)
          .mul(benefits.tradingFee * 100)
          .div(10000);

        // console.log({ platformFee });

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

        // console.log("SELL AND PLATFORM FEE OK");

        const firstSell = await checkFirst(msg.chat.id, activities.SELLTOKEN);
        if (firstSell) {
          const thePoints = await getActivityPoint(activities.FIRSTSELLTOKEN);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }

        const humanReadableAmount = ethers.utils.formatEther(
          swapTransaction.outAmount
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

        const walletTxOpt = {
          chat_id: msg.chat.id,
          chain_id: chainId,
          wallet_number: activeWallet,
          activity: activities.SELLTOKEN,
        };
        const saveTx = await saveWalletTx(walletTxOpt);

        resolve({
          hash: sendTxn.hash,
          blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("SELL TOKEN OPEN OCEAN ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      logger.error("SELL TOKEN OPEN OCEAN ERROR: ");
      logger.error(e.message);

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

module.exports = sellTokenOpenOcean;
