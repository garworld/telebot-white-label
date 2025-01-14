const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} = require("@solana/spl-token");
const { Transaction, PublicKey, Connection } = require("@solana/web3.js");

/**
 * Retrieve the associated token account, or create it if it doesn't exist
 *
 * @param { Connection } connection Connection to use
 * @param { import("@solana/web3.js").Signer } payer Payer of the transaction and initialization fees
 * @param { PublicKey } mint Mint associated with the account to set or verify
 * @param { PublicKey } owner Owner of the account to set or verify
 * @param { boolean | undefined } allowOwnerOffCurve Allow the owner account to be a PDA (Program Derived Address)
 * @param { import("@solana/web3.js").Commitment | undefined } commitment Desired level of commitment for querying the state
 * @param { import("@solana/web3.js").ConfirmOptions | undefined } confirmOptions Options for confirming the transaction
 * @param { PublicKey | undefined } programId SPL Token program account
 * @param { PublicKey | undefined } associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the new associated token account
 */
function getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  owner,
  allowOwnerOffCurve = false,
  commitment = "finalized",
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) {
  return new Promise(async (resolve, reject) => {
    let associatedToken;
    try {
      associatedToken = await getAssociatedTokenAddress(
        mint,
        owner,
        allowOwnerOffCurve,
        programId,
        associatedTokenProgramId
      );

      const account = await getAccount(
        connection,
        associatedToken,
        commitment,
        programId
      );

      return resolve(account);
    } catch (err) {
      //
      // console.error("ERROR NO TOKEN ACCOUNT: ", error);

      //
      try {
        const block = await connection.getLatestBlockhash("finalized");

        const wallet = payer;
        const accounts = await wallet.requestAccounts();

        //
        const publicKey = new PublicKey(accounts[0]);

        const transaction = new Transaction({
          blockhash: block.blockhash,
          lastValidBlockHeight: block.lastValidBlockHeight,
          feePayer: publicKey,
        }).add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedToken,
            owner,
            mint,
            programId,
            associatedTokenProgramId
          )
        );

        await payer.signAndSendTransaction(transaction);

        await new Promise((r) => setTimeout(r, 5000));

        let countChecking = 0;

        // interval checking account
        const checkAccount = setInterval(async () => {
          //
          if (countChecking > 10) {
            clearInterval(checkAccount);
            return reject(new Error("Please Try Again"));
          } else {
            countChecking += 1;
          }

          // Now this should succeed
          getAccount(connection, associatedToken, commitment, programId)
          .then(
            (account) => {
              clearInterval(checkAccount);
              return resolve(account);
            }
          )
          .catch((e) => {
            console.error("ERROR NO TOKEN ACCOUNT #3: ", e);
            return reject(new Error("Please Try Again"));
          });
        }, 5000);
      } catch (error) {
        // Ignore all errors
        // console.error("ERROR NO TOKEN ACCOUNT #2: ", err);
        console.error("ERROR NO TOKEN ACCOUNT #2: ", error);

        //
        return reject(error);
      }
    }
  });
}

module.exports = getOrCreateAssociatedTokenAccount;
