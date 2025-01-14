//
require("dotenv").config();

//
const ethers = require("ethers");

//
const logger = require("./logger");
const { DATA_CHAIN_LIST } = require("../constants/chains");
// const redis = require("./redis");

// const url = "https://mainnet.infura.io/v3/e5e7df39837a458ba631a8debf95bc80";

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * transferETH(chainIdx, to, amount, walletPK)
 *
 * @param { number } chainIdx
 * @param { string } to
 * @param { string } amount
 * @param { string } walletPK
 * @returns { Promise<TxResponse | null> }
 */
const transferETH = async (chainIdx, to, amount, walletPK, redis) => {
  return new Promise(async (resolve) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      //
      const provider = new ethers.providers.JsonRpcProvider(
        chains[chainIdx].rpc_provider
      );
      const wallet = new ethers.Wallet(walletPK, provider);

      //
      const transferTx = {
        to,
        // convert currency unit from ether to wei
        value: ethers.utils.parseEther(amount),
      };

      //
      const signTx = await wallet.sendTransaction(
        transferTx,
        chainIdx === 3
          ? {
              gasLimit: ethers.utils.hexlify(21000), // Example gas limit (adjust as needed)
              gasPrice: ethers.utils.hexlify(30000000000), // Example gas price in wei (adjust as needed)
            }
          : null
      );

      //
      let receipt = await signTx.wait();

      // logs the information about the transaction it has been mined.
      if (receipt) {
        const hash = signTx.hash;
        const blockNumber = receipt.blockNumber;
        // console.log(
        //   " - Transaction is mined - " + "\n" + "Transaction Hash:" +
        //   hash +
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

        // resolve(
        //   " - Transaction is mined - " + "\n" + "Transaction Hash:" +
        //   hash +
        //     "\n" +
        //     "Block Number: " +
        //     blockNumber +
        //     "\n" +
        //     "Navigate to https://etherscan.io/txn/" +
        //     hash,
        //   "to see your transaction"
        // );
      } else {
        // //
        // console.error(new Error("Error submitting transaction"));
        logger.error("TRANSFER ETH ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("TRANSFER ETH ERROR", e);
      logger.error("TRANSFER ETH ERROR: " + e.message);

      //
      if (e.error) {
        if (e.error.body) {
          // resolve("FAILED TO TRANSFER ETH: " + JSON.stringify(JSON.parse(e.error.body).error));
          resolve({
            hash: null,
            blockNumber: null,
            error: JSON.parse(e.error.body).error,
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

module.exports = { transferETH };
