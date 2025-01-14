require("dotenv").config();

const { wallet_number, activities } = require("@prisma/client");
const {
  Connection,
  VersionedTransaction,
  Transaction,
  SystemProgram,
  PublicKey,
} = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const fetch = require("cross-fetch");
const roundTo = require("round-to");

const logger = require("../logger");
const errorMsgCustomization = require("../errorMsgCustomization");
const { finalPointMultiplier } = require("../finalPointMultiplier");
const checkFirst = require("../../databases/checkFirst");
const getActivityPoint = require("../../databases/getActivityPoint");
const updatePoint = require("../../databases/updatePoint");
const { userBenefit } = require("../userBenefit");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const createWalletFromPrivateKey = require("./createWalletFromPrivateKey");
const saveWalletTx = require("../../databases/saveWalletTx");

/**
 * sellTokenJupiter(walletPK, tokenAddress, amount, slippage = "50")
 *
 * @param { string } walletPK
 * @param { string } tokenAddress
 * @param { string } amount
 * @param { string } slippage
 * @returns { Promise<TxResponse | null> }
 */
function sellTokenJupiter(
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
  sellTokenAddress = null,
  deadline = 10 * 3600
) {
  return new Promise(async (resolve) => {
    try {
      // identify wallet number
      let activeWallet;
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
        "confirmed"
      );

      const wallet = solanaWallet;
      const accounts = await solanaWallet.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);

      // console.log({ publicKey });

      const params = {
        tokenIn: tokenAddress,
        tokenOut: sellTokenAddress
          ? sellTokenAddress
          : "So11111111111111111111111111111111111111112",
      };

      // token decimals will be available in the `decimals` property
      const decimals = await getTokenDecimals(connection, tokenAddress);

      // console.log({ decimals });

      const amountInLamport = roundTo(amount * 10 ** decimals, 0);

      // swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
      const quoteResponse = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${
            params.tokenIn
          }&outputMint=${
            params.tokenOut
          }&amount=${amountInLamport}&slippageBps=${slippage * 100}`
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

      //
      // console.log({ swapTransaction });

      // deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
      let transaction = VersionedTransaction.deserialize(swapTransactionBuf, {
        skipPreflight: true,
        maxRetries: 10,
      });

      //
      // console.log({ swapTransactionBuf });

      // console.log({ transaction });

      const { signature: txId } = await wallet.signAndSendTransaction(
        transaction
      );

      //
      console.log({ txId });

      // once the swap transaction is complete
      if (txId) {
        // const hash = sendTxHash;
        // note fix - can get it from "txComplete"
        // const transaction = await connection.getTransaction(txId, {
        //   commitment: "confirmed",
        //   maxSupportedTransactionVersion: 0,
        // });
        // const blockNumber = transaction.blockTime;

        //
        const benefits = await userBenefit(msg);

        //
        // console.log({ benefits });

        //
        const platformFee =
          (Number(quoteResponse.outAmount) * benefits.tradingFee) / 100;

        //
        // console.log({ platformFee, amount: quoteResponse.outAmount });

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

        const TransactionInstruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(accounts[0]),
          toPubkey: new PublicKey(process.env.PLATFORM_SOL_WALLET),
          lamports: Math.floor(platformFee),
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

        const firstSell = await checkFirst(msg.chat.id, activities.SELLTOKEN);
        if (firstSell) {
          const thePoints = await getActivityPoint(activities.FIRSTSELLTOKEN);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }

        await finalPointMultiplier(
          msg.chat.id,
          activeWallet,
          activities.SELLTOKEN,
          amount,
          chains[chainIdx].chain_id,
          publicKey.toBase58(),
          msg,
          redis,
          sellTokenAddress ? true : false
        );

        // console.log("test", checkFunc);

        // save wallet tx to db
        const walletTxopt = {
          chat_id: msg.chat.id,
          chain_id: chains[chainIdx].chain_id,
          wallet_number: activeWallet,
          activity: activities.SELLTOKEN,
        };
        const saveTx = await saveWalletTx(walletTxopt);

        resolve({
          hash: txId,
          // blockNumber,
          error: null,
        });
      } else {
        //
        logger.error("SELL TOKEN USE JUPITER ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      //
      logger.error("SELL TOKEN USE JUPITER ERROR: ");
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

async function getTokenDecimals(connection, address) {
  // 'confirmed' can be changed to 'processed' or 'recent' based on your preference

  const tokenOutPublicAddress = new PublicKey(address);

  const tokenMintInfo = await connection.getParsedAccountInfo(
    tokenOutPublicAddress
  );

  return tokenMintInfo.value.data.parsed.info.decimals;
}

module.exports = sellTokenJupiter;
