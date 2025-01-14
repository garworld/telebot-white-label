//
require("dotenv").config();

//
const { wallet_number, activities } = require("@prisma/client");
const { Token } = require("@uniswap/sdk");
// const appRootPath = require("app-root-path");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
const appRootPath = require("app-root-path");

const erc20abi = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();

//
const logger = require("./logger");
// const redis = require("./redis");
const {
  // getAllowanceAmount,
  getTokenDecimals,
} = require("./tokenHelper");
const errorMsgCustomization = require("./errorMsgCustomization");
const { finalPointMultiplier } = require("./finalPointMultiplier");
const checkFirst = require("../databases/checkFirst");
const getActivityPoint = require("../databases/getActivityPoint");
const updatePoint = require("../databases/updatePoint");
const { userBenefit } = require("./userBenefit");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const {
  buildOpenOceanTxForSwap,
  getChainGasPrice,
  buildOpenOceanTxForApproveTradeWithRouter,
} = require("./openOcean");
const saveWalletTx = require("../databases/saveWalletTx");
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
function buyOpenOcean(
  chainIdx,
  walletPK,
  tokenAddress,
  amount,
  slippage = 0.1,
  isPrivate = false,
  msg,
  walletUsed,
  chains,
  redis,
  buyTokenAddress = null,
  deadline = 10 * 3600
) {
  return new Promise(async (resolve) => {
    try {
      const openOceanRouter = "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64";

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

      //
      const tokenOut = new Token(chainId, tokenAddress, tokenDecimals); // token want to buy
      // console.log({ tokenOut });
      let tokenBuy = buyTokenAddress
        ? new Token(chainId, buyTokenAddress, buyTokenDecimals)
        : "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"; // token used for buy

      // console.log({ amount, buyTokenDecimals });
      let amountIn = ethers.utils.parseUnits(
        amount.toString(),
        buyTokenDecimals
      ); // weth always has 18 dec
      // console.log({ amountIn });

      // note double check no decimals
      const platformFee = amountIn.div(100);
      // console.log(platformFee);

      if (!buyTokenAddress) {
        amountIn = amountIn.sub(platformFee);
      }
      // gas price
      const gasPrice = await getChainGasPrice(chainId);
      // console.log({ getGasPrice });

      // approve tx

      if (buyTokenAddress == null) {
        const metisContract = new ethers.Contract(
          "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
          erc20abi,
          wallet
        );
        // console.log({ metisContract });

        const approveTx = await metisContract.approve(
          openOceanRouter,
          amountIn
        );
        // console.log({ approveTx });

        await approveTx.wait(1);
      } else {
        const buyContract = new ethers.Contract(
          buyTokenAddress,
          erc20abi,
          wallet
        );

        const approveTx = await buyContract.approve(openOceanRouter, amountIn);

        await approveTx.wait(1);
      }

      let amountInForParam = +amountIn / 10 ** buyTokenDecimals;

      const swapParams = {
        outTokenAddress: tokenOut.address, // Token address want to buy
        // tokenOutChainId: chainId, // Token address of WETH
        inTokenAddress: buyTokenAddress ? tokenBuy.address : tokenBuy, // Token used to buy
        // tokenInChainId: chainId, // Token address of desired token
        amount: amountInForParam, // Amount of 1INCH to swap (in wei)
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        gasPrice,
        account: wallet.address,
      };

      const swapTransaction = await buildOpenOceanTxForSwap(
        swapParams,
        chainId
      );
      // console.log({ swapTransaction });

      if (!swapTransaction) resolve(null);

      // const { data, estimatedGas, gasPrice } = swapTransaction;
      const { data, estimatedGas } = swapTransaction;

      // console.log({
      //   data,
      //   estimatedGas,
      //   gasPrice,
      // });

      const transaction = {
        from: wallet.address,
        to: openOceanRouter, //Please use the contract from the contract page
        gasLimit: estimatedGas,
        gasPrice: gasPrice * 1000000000,
        data,
      };
      // console.log({ transaction });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const sendTxn = await wallet.sendTransaction(transaction);
      // console.log({ sendTxn });

      // console.log({ sendTxn });

      // Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
      let txComplete = await sendTxn.wait();
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
            gasLimit: ethers.utils.hexlify(21000), // Example gas limit (adjust as needed)
            gasPrice: ethers.utils.hexlify(30000000000), // Example gas price in wei (adjust as needed)
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

        // save wallet tx to db
        const walletTxOpt = {
          chat_id: msg.chat.id,
          chain_id: chainId,
          wallet_number: activeWallet,
          activity: activities.BUYTOKEN,
        };
        const saveTx = await saveWalletTx(walletTxOpt);

        // console.log({ saveTx });

        // console.log("test", checkFunc);

        resolve({
          hash: sendTxn.hash,
          blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("BUY TOKEN USE OPEN OCEAN ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      //
      logger.error("BUY TOKEN USE OPEN OCEAN ERROR: ");
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

// const testTx = async () => {
//   console.log("start");
//   const openOceanRouter = "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64";
//   const provider = new ethers.providers.JsonRpcProvider(
//     "https://metis-pokt.nodies.app/"
//   );
//   const wallet = new ethers.Wallet(
//     "",
//     provider
//   );
//   const data =
//     "0x90411a320000000000000000000000008d2b7e5501eb6d92f8e349f2febe785dd070be74000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead0000000000000000000000000000bb06dca3ae6887fabf931640f67cab3e3a16f4dc0000000000000000000000008d2b7e5501eb6d92f8e349f2febe785dd070be74000000000000000000000000fb003933ae0be86ba3a6cb98b54b93e8f41703a4000000000000000000000000000000000000000000000000015c2a7b13fd000000000000000000000000000000000000000000000000000000000000007487b70000000000000000000000000000000000000000000000000000000000817a59000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000090000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000004a0000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000008200000000000000000000000000000000000000000000000000000000000000a800000000000000000000000000000000000000000000000000000000000000ba00000000000000000000000000000000000000000000000000000000000000cc00000000000000000000000000000000000000000000000000000000000000de0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001a49f865422000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000000000000a000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000064d1660f99000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead0000000000000000000000000000732f7a04faba1fccbd36ac22ba9903b2f51f33fb00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000643afe5f00800000000000000002710001732f7a04faba1fccbd36ac22ba9903b2f51f33fb000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000008d2b7e5501eb6d92f8e349f2febe785dd070be7400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001a49f865422000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000000000000a000000000000000000000000000000be0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000064d1660f99000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead000000000000000000000000000075ef3cebdd2b8e42d459cdecad4167be86cfd51100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000643afe5f0080000000000000000271000175ef3cebdd2b8e42d459cdecad4167be86cfd511000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000008d2b7e5501eb6d92f8e349f2febe785dd070be7400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001a49f865422000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead000000000000000000000000000000000009000000000000000000000000000000090000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000064d1660f99000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000005ab390084812e145b619ecaa8671d39174a1a6d100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000643afe5f000000000000000000027100015ab390084812e145b619ecaa8671d39174a1a6d1000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead0000000000000000000000000000c7c7509d1a192f00c806a0793e5946aae7266d6a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000643afe5f00800000000000000002710001c7c7509d1a192f00c806a0793e5946aae7266d6a000000000000000000000000ea32a96608495e54156ae48931a7c20f0dcc1a210000000000000000000000008d2b7e5501eb6d92f8e349f2febe785dd070be7400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000648a6a1e85000000000000000000000000bb06dca3ae6887fabf931640f67cab3e3a16f4dc000000000000000000000000353c1f0bc78fbbc245b3c93ef77b1dcc5b77d2a00000000000000000000000000000000000000000000000000000000000817a5900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001a49f865422000000000000000000000000bb06dca3ae6887fabf931640f67cab3e3a16f4dc00000000000000000000000000000001000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000064d1660f99000000000000000000000000bb06dca3ae6887fabf931640f67cab3e3a16f4dc000000000000000000000000fb003933ae0be86ba3a6cb98b54b93e8f41703a400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

//   // approve tx
//   const metisContract = new ethers.Contract(
//     "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
//     erc20abi,
//     wallet
//   );

//   const approveTx = await metisContract.approve(
//     openOceanRouter,
//     "98010000000000000"
//   );

//   await approveTx.wait(1);
//   const transaction = {
//     from: wallet.address,
//     to: openOceanRouter, //Please use the contract from the contract page
//     // gasLimit: estimatedGas,
//     // gasPrice: gasPrice,
//     data,
//   };

//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   const sendTxn = await wallet.sendTransaction(transaction);

//   console.log({ sendTxn });
// };

// testTx();

module.exports = buyOpenOcean;
