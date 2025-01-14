const {
  Connection,
  PublicKey,
  // LAMPORTS_PER_SOL,
  Transaction,
  clusterApiUrl,
  // Keypair,
} = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const logger = require("../logger");
// const { createPrivateKey } = require("./web3authSolana");
const getOrCreateAssociatedTokenAccount = require("./getOrCreateAssociatedTokenAccount");
const roundTo = require("round-to");
const { SolanaWallet } = require("@web3auth/solana-provider");

/**
 *
 * @param { number } chainIdx
 * @param { string } toPubKey
 * @param { string } tokenAddress
 * @param { number } amount
 * @param { SolanaWallet } solanaWallet
 * @param { import("redis").RedisClientType } redis
 * @returns
 */
const transferTokenSol = (
  chainIdx,
  toPubKey,
  tokenAddress,
  amount,
  solanaWallet,
  redis
) => {
  return new Promise(async (resolve) => {
    try {
      // console.log({ solanaWallet });

      // // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
      // const chains = DATA_CHAIN_LIST;

      //
      const provider = new Connection(
        chains[chainIdx].rpc_provider || clusterApiUrl("mainnet-beta"),
        "confirmed"
      );

      //
      const wallet = solanaWallet;
      const accounts = await wallet.requestAccounts();
      // console.log({ accounts });

      //
      const publicKey = new PublicKey(accounts[0]);
      // console.log({ publicKey });

      //
      const mint = await splToken.getMint(
        provider,
        new PublicKey(tokenAddress)
      );
      // console.log({ mint });

      const decimals = mint.decimals;
      const amountIn = roundTo(amount * 10 ** decimals, 0);
      // console.log({ amountIn });

      // await new Promise(r => setTimeout(r, 5000));

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider,
        wallet,
        new PublicKey(tokenAddress),
        publicKey
      );

      // console.log({ fromTokenAccount: fromTokenAccount.address });

      // await new Promise(r => setTimeout(r, 5000));

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider,
        wallet,
        new PublicKey(tokenAddress),
        new PublicKey(toPubKey)
      );

      // console.log({ toTokenAccount: toTokenAccount.address });

      const block = await provider.getLatestBlockhash("finalized");

      // console.log("TO PUBKEY", new PublicKey(toPubKey));

      // const checkAccount = await provider.getAccountInfo(
      //   new PublicKey(toPubKey),
      //   { commitment: "finalized" }
      // );

      // console.log({ checkAccount });

      //
      const transaction = new Transaction({
        blockhash: block.blockhash,
        lastValidBlockHeight: block.lastValidBlockHeight,
        feePayer: publicKey,
      }).add(
        splToken.createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          publicKey,
          amountIn,
          [],
          splToken.TOKEN_PROGRAM_ID
        )
        // splToken.createTransferInstruction(
        //   // splToken.TOKEN_PROGRAM_ID,
        //   new PublicKey(tokenAddress),
        //   new PublicKey(tokenAddress),
        //   // new PublicKey(toPubKey),
        //   publicKey,
        //   amountIn,
        //   [],
        //   // amountIn,
        //   splToken.TOKEN_PROGRAM_ID
        // )
      );

      // console.log({ transaction });
      // Sign transaction, broadcast, and confirm
      const { signature } = await wallet.signAndSendTransaction(transaction);

      // console.log({ signature });

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
      }
    } catch (e) {
      // // error logging
      // console.error("TRANSFER TOKEN ERROR", e);
      // console.error(e);
      logger.error("TRANSFER TOKEN SOLANA ERROR: " + e.message);

      //
      if (e.error) {
        if (e.error.body) {
          // resolve("FAILED TO TRANSFER TOKEN: " + JSON.stringify(JSON.parse(e.error.body).error));
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
          });
        } else {
          // resolve("FAILED TO TRANSFER TOKEN -");
          resolve(null);
        }
      } else {
        // resolve("FAILED TO TRANSFER TOKEN .");
        resolve(null);
      }
    }
  });
};

// const solanaWallet = createPrivateKey(1, 1);

// solanaWallet.then((wallet) => {
//   console.log(wallet);
//   transferTokenSol(
//     4,
//     "DBGeo5fMbo4PN4iD59YgiPwJLNW39azejBzQo7gpnzMZ",
//     "0.001",
//     wallet,
//     null
//   );
// });

module.exports = { transferTokenSol };
