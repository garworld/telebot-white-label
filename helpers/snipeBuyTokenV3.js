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
  CurrencyAmount,
} = require("@uniswap/sdk");
const { Pool } = require("@uniswap/v3-sdk/");
const QuoterABI = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const IUniswapV3Factory = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json");
const { AlphaRouter } = require("@uniswap/smart-order-router");
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
const UNISWAP_V3_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_V3_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const UNISWAP_V3_SWAP_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
// const UNISWAP_V3_ABI = fs
//   .readFileSync(path.resolve(appRootPath.path, "abis", "uniswapv3.json"))
//   .toString();
const ERC20_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();

const getTokenAndBalance = async function (contract, walletAddress) {
  let [dec, symbol, name, balance] = await Promise.all(
    [
      contract.decimals(),
      contract.symbol(),
      contract.name(),
      contract.balanceOf(walletAddress)
    ]
  );

  return [new Token(chainId, contract.address, dec, symbol, name), balance];
}

const getPoolState = async function (poolContract) {
  const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);

  return {
    liquidity: liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  }
}

const getPoolImmutables = async function (poolContract) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
    poolContract.factory(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.tickSpacing(),
    poolContract.maxLiquidityPerTick(),
  ]);

  return {
    factory: factory,
    token0: token0,
    token1: token1,
    fee: fee,
    tickSpacing: tickSpacing,
    maxLiquidityPerTick: maxLiquidityPerTick,
  }
}

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
function snipeBuyTokenV3(
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
      const wallet = new ethers.Wallet(walletPK, provider);

      //
      const contractIn = new ethers.Contract(tokenInAddress, ERC20_ABI, wallet);
      const contractOut = new ethers.Contract(tokenOutAddress, ERC20_ABI, wallet);

      //
      const [tokenIn, balanceTokenIn] = await getTokenAndBalance(contractIn, wallet.address);
      const [tokenOut, balanceTokenOut] = await getTokenAndBalance(contractOut, wallet.address);

      // this is Uniswap factory, same address on all chains
      // (from https://docs.uniswap.org/protocol/reference/deployments)
      const factoryContract = new ethers.Contract(UNISWAP_V3_FACTORY_ADDRESS, IUniswapV3Factory.abi, provider);

      // loading pool smart contract address
      const poolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        3000
      ); // commission - 3%

      if (Number(poolAddress).toString() === "0") {
        logger.error(`NO POOL ${tokenIn.symbol}-${tokenOut.symbol}`);
        resolve(null);
      };

      //
      const poolContract = new ethers.Contract(poolAddress, IUniswapV3Pool.abi, provider);

      // loading immutable pool parameters and its current state (variable parameters)
      const [immutables, state] = await Promise.all([getPoolImmutables(poolContract), getPoolState(poolContract)]);

      //
      const pool = new Pool(
        tokenIn,
        tokenOut,
        immutables.fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick
      );

      //
      let amountIn = ethers.utils.parseUnits(amount.toString(), tokenIn.decimals);

      const checkSwapParams = {
        src: tokenIn.address, // Token address of desired token
        dst: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Token address of ETH
        amount: +amountIn.toString(), // Amount of 1INCH to swap (in wei)
        from: wallet.address,
        slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
        disableEstimate: false, // Set to true to disable estimation of swap details
        allowPartialFill: false, // Set to true to allow partial filling of the swap order
      };

      //
      // console.log(checkSwapParams);

      //
      const swapTransaction = await buildTxForSwap(checkSwapParams, chainId);
      const benefits = await userBenefit(msg);

      // note double check no decimals
      // const platformFee = amountIn.div(100);
      const platformFee = ethers.BigNumber.from(swapTransaction.amount)
        .mul(benefits.tradingFee * 100)
        .div(10000);
      // amountIn = amountIn.sub(platformFee);

      //
      const quoterContract = new ethers.Contract(UNISWAP_V3_QUOTER_ADDRESS, QuoterABI.abi, provider);
      const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        tokenIn.address,
        tokenOut.address,
        pool.fee,
        amountIn,
        0
      );

      //
      const inAmount = CurrencyAmount.fromRawAmount(tokenIn, amountIn.toString());

      //
      const router = new AlphaRouter({ chainId: tokenIn.chainId, provider });
      let deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      if (deadlineSec) deadline = Math.floor(Date.now() / 1000) + Number(deadlineSec);
      const route = await router.route(
        inAmount,
        tokenOut,
        TradeType.EXACT_INPUT,
        // swapOptions
        {
          recipient: wallet.address,
          slippageTolerance: new Percent(slippage, "10000"), // Big slippage
          deadline, // add seconds – mins deadline
        },
        // router config
        {
            // only one direct swap for a reason – 2 swaps thru DAI (USDT->DAI->WETH) didn't work on Rinkeby
            // There was an overflow problem https://rinkeby.etherscan.io/tx/0xaed297f2f51f17b329ce755b11635980268f3fc88aae10e78cf59f2c6e65ca7f
            // The was DAI balance for UniswapV2Pair was greater than 2^112-1 (https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)
            // UniswapV2Pair – https://rinkeby.etherscan.io/address/0x8b22f85d0c844cf793690f6d9dfe9f11ddb35449
            // WETH – https://rinkeby.etherscan.io/address/0xc778417e063141139fce010982780140aa0cd5ab#readContract
            // DAI – https://rinkeby.etherscan.io/address/0xc7ad46e0b8a400bb3c915120d284aafba8fc4735#readContract (balance of UniswapV2Pair more than 2^112-1)

            maxSwapsPerPath: 1 // remove this if you want multi-hop swaps as well.
        }
      );

      if (!route || !route.methodParameters) {
        logger.error("NO ROUTE LOADED");
        resolve(null);
      }

      if (approval) {
        // here we just create a transaction object (not sending it to blockchain).
        const approveTxUnsigned = await contractIn.populateTransaction.approve(UNISWAP_V3_SWAP_ADDRESS, amountIn);
        // by default chainid is not set https://ethereum.stackexchange.com/questions/94412/valueerror-code-32000-message-only-replay-protected-eip-155-transac
        approveTxUnsigned.chainId = chainId;
        // estimate gas required to make approve call (not sending it to blockchain either)
        approveTxUnsigned.gasLimit = gasLimit;
        // suggested gas price (increase if you want faster execution)
        approveTxUnsigned.gasPrice = gasPrice;
        // nonce is the same as number previous transactions
        approveTxUnsigned.nonce = await provider.getTransactionCount(wallet.address);

        // sign transaction by our signer
        const approveTxSigned = await wallet.signTransaction(approveTxUnsigned);
        // submit transaction to blockchain
        const submittedTx = await provider.sendTransaction(approveTxSigned);
        // wait till transaction completes
        const approveReceipt = await submittedTx.wait();

        //
        if (approveReceipt.status === 0) {
          logger.error("APPROVE TX FAILED");
          resolve(null);
        }
      }
      
      const value = BigNumber.from(route.methodParameters.value);

      const rawTxn = {
        data: route.methodParameters.calldata,
        to: UNISWAP_V3_SWAP_ADDRESS,
        value,
        from: wallet.address,
        gasPrice,

        // route.estimatedGasUsed might be too low!
        // most of swaps I tested fit into 300,000 but for some complex swaps this gas is not enough.
        // Loot at etherscan/polygonscan past results.
        gasLimit,
      };

      // const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
      //   UNISWAP_V3_SWAP_ADDRESS,
      //   UNISWAP_V3_ABI,
      //   provider
      // );
      // const tokenInDecimals = await getTokenDecimals(provider, tokenInAddress);
      // const tokenOutDecimals = await getTokenDecimals(provider, tokenOutAddress);
      // const tokenIn = new Token(chainId, tokenInAddress, tokenInDecimals); // Token 1
      // const tokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals); // Token 2
      // const pair = await Fetcher.fetchPairData(tokenIn, tokenOut, provider); // creating instances of a pair
      // const route = new Route([pair], tokenIn); // a fully specified path from input token to output token
      // // let amountIn = ethers.utils.parseEther(amount.toString()); // helper function to convert ETH to Wei
      // let amountIn = ethers.utils.formatUnits(amount.toString(), +tokenInDecimals); // helper function to convert ETH to Wei
      
      // const swapParams = {
      //   src: tokenIn.address, // Token address of desired token
      //   dst: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Token address of ETH
      //   amount: +amountIn.toString(), // Amount of 1INCH to swap (in wei)
      //   from: wallet.address,
      //   slippage, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
      //   disableEstimate: false, // Set to true to disable estimation of swap details
      //   allowPartialFill: false, // Set to true to allow partial filling of the swap order
      // };

      // //
      // console.log(swapParams);

      // //
      // const swapTransaction = await buildTxForSwap(swapParams, chainId);
      // const benefits = await userBenefit(msg);

      // // note double check no decimals
      // // const platformFee = amountIn.div(100);
      // const platformFee = ethers.BigNumber.from(swapTransaction.amount)
      //   .mul(benefits.tradingFee * 100)
      //   .div(10000);
      // amountIn = amountIn.sub(platformFee);
      // const amountInHex = ethers.BigNumber.from(
      //   +amountIn.toString()
      // ).toHexString();

      // const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
      // const trade = new Trade( // information necessary to create a swap transaction.
      //   route,
      //   new TokenAmount(tokenIn, amountIn),
      //   TradeType.EXACT_INPUT
      // );

      // const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      // const amountOutMinHex = ethers.BigNumber.from(
      //   amountOutMin.toString()
      // ).toHexString();
      // const path = [tokenIn.address, tokenOut.address]; // An array of token addresses
      // const to = wallet.address; // should be a checksummed recipient address
      // let deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      // if (deadlineSec) deadline = Math.floor(Date.now() / 1000) + Number(deadlineSec);
      // // const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      // const value = trade.inputAmount.raw; // needs to be converted to e.g. hex
      // const valueHex = ethers.BigNumber.from(value.toString()).toHexString(); // convert to hex string

      // // console.log({
      // //   value: +ethers.utils.formatEther(value.toString()),
      // //   amountOutMin: +amountOutMin / 10 ** tokenInDecimals,
      // //   path,
      // //   to,
      // //   deadline,
      // // });

      // // Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
      // const rawTxn =
      //   await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactTokensForTokens(
      //     amountInHex,
      //     amountOutMinHex,
      //     path,
      //     to,
      //     deadline,
      //     {
      //       value: valueHex,
      //     }
      //   );

      // rawTxn.gasLimit = gasLimit;
      // rawTxn.gasPrice = gasPrice;

      // // Returns a Promise which resolves to the transaction.
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
        logger.error("SNIPE BUY TOKEN V3 ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("BUY ERROR", e);
      logger.error("SNIPE BUY TOKEN V3 ERROR: ");
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

module.exports = snipeBuyTokenV3;
