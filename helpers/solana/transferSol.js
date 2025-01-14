const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const logger = require("../logger");
const { createPrivateKey } = require("./web3authSolana");

const transferSOL = async (chainIdx, toPubkey, amount, solanaWallet, redis) => {
  return new Promise(async (resolve) => {
    // console.log({
    //   chainIdx,
    //   toPubkey,
    //   amount,
    //   solanaWallet,
    // });
    try {
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // const chains = DATA_CHAIN_LIST;

      //
      const provider = new Connection(
        chains[chainIdx].rpc_provider,
        "confirmed"
      );

      // console.log({ provider });
      //
      const wallet = solanaWallet;
      const accounts = await solanaWallet.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      // console.log(publicKey);

      //
      const lamportsToSend = Number(amount) * LAMPORTS_PER_SOL;
      // console.log({ lamportsToSend });

      //
      const block = await provider.getLatestBlockhash("finalized");
      // console.log({ block });

      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(accounts[0]),
        toPubkey: toPubkey,
        lamports: lamportsToSend,
      });

      // console.log({ TransactionInstruction });

      const transaction = new Transaction({
        blockhash: block.blockhash,
        lastValidBlockHeight: block.lastValidBlockHeight,
        feePayer: new PublicKey(accounts[0]),
      }).add(TransactionInstruction);

      // console.log({ transaction });

      const { signature } = await solanaWallet.signAndSendTransaction(
        transaction
      );

      // console.log({ signature });

      // //
      // const transferTransaction = new Transaction().add(
      //   SystemProgram.transfer({
      //     fromPubkey: "CVvLZS8rscWinfLhVAA9afo1SkRJBSvdXaDWLZNSZMxS",
      //     toPubkey: toPubkey,
      //     lamports: lamportsToSend,
      //   })
      // );

      // console.log({ provider, transferTransaction, publicKey });

      // const { signature } = await wallet.signAndSendTransaction(
      //   transferTransaction
      // );

      if (signature) {
        const hash = signature;

        //
        logger.debug({
          hash,
        });

        //
        resolve({
          hash,
          error: null,
        });
      } else {
        logger.error("TRANSFER SOLANA ERROR");
        resolve(null);
      }
    } catch (e) {
      //
      logger.error("TRANSFER SOLANA ERROR: " + e);

      // console.log("error disini");
      //
      if (e.error) {
        if (e.error.body) {
          const errorBody = JSON.parse(e.error.body);
          const errorCode = errorBody?.code || 500;
          const errorMessage = errorBody?.error || "Unknown error";

          resolve({
            hash: null,
            blockNumber: null,
            error: {
              code: errorCode,
              message: errorMessage,
            },
          });
        } else {
          // resolve("FAILED TO TRANSFER ETH -");
          resolve(null);
        }
      } else {
        // resolve("FAILED TO TRANSFER ETH .");
        resolve(null);
      }
    }
  });
};

// const solanaWallet = createPrivateKey(1, 1);

// solanaWallet.then((wallet) => {
//   console.log(wallet);
//   transferSOL(
//     4,
//     "DBGeo5fMbo4PN4iD59YgiPwJLNW39azejBzQo7gpnzMZ",
//     "0.001",
//     wallet,
//     null
//   );
// });

module.exports = { transferSOL };
