require("dotenv").config();

const { wallet_number, activities } = require("@prisma/client");
const {
  Connection,
  VersionedTransaction,
  Transaction,
  SystemProgram,
  PublicKey,
} = require("@solana/web3.js");
const fetch = require("cross-fetch");
const roundTo = require("round-to");

const { createPrivateKey } = require("./web3authSolana");
const errorMsgCustomization = require("../errorMsgCustomization");
const { finalPointMultiplier } = require("../finalPointMultiplier");
const logger = require("../logger");
const createWalletFromPrivateKey = require("../solana/createWalletFromPrivateKey");
const { userBenefit } = require("../userBenefit");
const { getCoinInfoByAddress } = require("../../apis/coingecko");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const checkFirst = require("../../databases/checkFirst");
const getActivityPoint = require("../../databases/getActivityPoint");
const updatePoint = require("../../databases/updatePoint");
const saveWalletTx = require("../../databases/saveWalletTx");

/**
 * buyTokenJupiter(walletPK, tokenAddress, amount, slippage = "50")
 *
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function buyTokenJupiter(
  chainIdx,
  solanaWallet,
  tokenAddress,
  amount,
  slippage = "0",
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
      // identify wallet number
      let activeWallet;

      //
      if (walletUsed == 1) {
        activeWallet = wallet_number.FIRST;
      } else if (walletUsed == 2) {
        activeWallet = wallet_number.SECOND;
      } else if (walletUsed == 3) {
        activeWallet = wallet_number.THIRD;
      }

      // it is recommended that you use your own RPC endpoint.
      // this RPC endpoint is only for demonstration purposes so that this example will run.
      const connection = new Connection(
        chains[chainIdx].rpc_provider,
        // "https://go.getblock.io/17039082a0fa4cc2b79ee4368a1824c6",
        "confirmed"
      );

      //
      // console.log({ solanaWallet });

      const wallet = solanaWallet;
      const accounts = await solanaWallet.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      // console.log({ publicKey });
      // console.log(publicKey.toBase58());
      const params = {
        tokenIn: buyTokenAddress
          ? buyTokenAddress
          : "So11111111111111111111111111111111111111112",
        tokenOut: tokenAddress,
      };

      //

      let decimal = 9;

      if (buyTokenAddress) {
        // console.log({ buyTokenAddress });
        const tokenInfo = await getCoinInfoByAddress(4, buyTokenAddress);
        decimal = tokenInfo.toToken.decimals;
      }

      //
      // console.log({ decimal });

      //
      const benefits = await userBenefit(msg);

      //
      // console.log({ benefits });

      //
      const amountInLamport = amount * 10 ** decimal;

      // note double check no decimals
      const platformFee = roundTo(
        amount * 10 ** (decimal - 2) * benefits.tradingFee,
        0
      ); // 1% fee

      //
      // console.log({ platformFee });

      //
      const amountIn = amountInLamport - platformFee;

      // console.log({ amountIn });

      // swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
      const quoteResponse = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${
            params.tokenIn
          }&outputMint=${params.tokenOut}&amount=${amountIn}&slippageBps=${
            slippage * 100
          }`
        )
      ).json();

      // console.log({ quoteResponse });

      // get serialized transactions for the swap

      const { swapTransaction } = await (
        await fetch("https://quote-api.jup.ag/v6/swap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse,
            // user public key to be used for the swap
            userPublicKey: publicKey.toBase58(),
            // auto wrap and unwrap SOL. default is true
            wrapAndUnwrapSol: true,
            // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
            // feeAccount: "fee_account_public_key"
          }),
        })
      ).json();

      // console.log({ swapTransaction });

      // deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
      let transaction = VersionedTransaction.deserialize(swapTransactionBuf, {
        skipPreflight: true,
        maxRetries: 10,
      });

      //
      // console.log({ swapTransactionBuf, transaction });

      const { signature: txId } = await wallet.signAndSendTransaction(
        transaction
      );

      console.log({ txId });
      // await new Promise((resolve) => setTimeout(resolve, 5000));

      // once the swap transaction is complete
      if (txId) {
        // const hash = sendTxHash;
        // note fix - can get it from "txComplete"

        // const transaction = await connection.getTransaction(txId, {
        //   commitment: "finalized",
        //   maxSupportedTransactionVersion: 0,
        // });

        // console.log({ transaction });

        // const blockNumber = transaction.slot;

        // console.log(blockNumber);

        // console.log({ transaction });
        // const blockNumber = transaction.slot;

        // send fees from wallet to our platform wallet
        // const transferTransaction = new Transaction().add(
        //   SystemProgram.transfer({
        //     fromPubkey: publicKey,
        //     toPubkey: process.env.PLATFORM_SOL_WALLET,
        //     lamports: platformFee,
        //   })
        // );

        // const { signature } = await wallet.signAndSendTransaction(
        //   transferTransaction
        // );

        const block = await connection.getLatestBlockhash("finalized");

        //
        // console.log({ platformFee });

        const TransactionInstruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(accounts[0]),
          toPubkey: new PublicKey(process.env.PLATFORM_SOL_WALLET),
          lamports: platformFee,
        });

        const transaction = new Transaction({
          blockhash: block.blockhash,
          lastValidBlockHeight: block.lastValidBlockHeight,
          feePayer: new PublicKey(accounts[0]),
        }).add(TransactionInstruction);

        const { signature } = await solanaWallet.signAndSendTransaction(
          transaction
        );

        //
        console.log({ signature });

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
          publicKey.toBase58(),
          msg,
          redis,
          buyTokenAddress ? true : false
        );

        // console.log("test", checkFunc);

        // save wallet tx to db
        const walletTxopt = {
          chat_id: msg.chat.id,
          chain_id: chains[chainIdx].chain_id,
          wallet_number: activeWallet,
          activity: activities.BUYTOKEN,
        };
        const saveTx = await saveWalletTx(walletTxopt);

        resolve({
          hash: txId,
          // blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("BUY TOKEN USE Jupiter ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      //
      logger.error("BUY TOKEN USE Jupiter ERROR: ");
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
            "Unknown error, if the problem persist please contact support!";

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

// const solanaWallet = createPrivateKey(1, 1);

// solanaWallet.then((wallet) => {
//   buyTokenJupiter(
//     4,
//     wallet,
//     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//     "0.99",
//     0,
//     false,
//     null,
//     1,
//     null,
//     null
//   );
// });

module.exports = buyTokenJupiter;
