//
require("dotenv").config();

//
const appRootPath = require("app-root-path");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

//
const logger = require("./logger");
const { DATA_CHAIN_LIST } = require("../constants/chains");
// const redis = require("./redis");

//
const ERC20_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();

//
const getTokenDecimals = (provider, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      const ERC20_CONTRACT = new ethers.Contract(address, ERC20_ABI, provider);
      const decimals = await ERC20_CONTRACT.decimals();
      resolve(decimals);
    } catch (e) {
      console.error("GET TOKEN DECIMALS ERROR", e);
      // logger.error("GET TOKEN DECIMALS ERROR: " + e.message);
      reject(e);
    }
  });
};

//
const getAllowanceAmount = (provider, address, owner, spender) => {
  return new Promise(async (resolve, reject) => {
    try {
      const ERC20_CONTRACT = new ethers.Contract(address, ERC20_ABI, provider);
      const allowance = await ERC20_CONTRACT.allowance(owner, spender);
      resolve(allowance);
    } catch (e) {
      console.error("GET ALLOWANCE AMOUNT ERROR", e);
      // logger.error("GET ALLOWANCE AMOUNT ERROR: " + e.message);
      reject(e);
    }
  });
};

/**
 * @typedef { object } TxResponse
 * @property { string | null } hash - The chain_name of moralis list
 * @property { number | null } blockNumber - The chain_id of moralis list
 * @property { Error | null } error - The chain_id of moralis list
 */

/**
 * transferToken(chainIdx, address, from, to, amount, walletPK)
 *
 * @param { number } chainIdx
 * @param { string } address
 * @param { string } from
 * @param { string } to
 * @param { string } amount
 * @param { string } walletPK
 * @returns { Promise<TxResponse | null> }
 */
const transferToken = (
  chainIdx,
  address,
  from,
  to,
  amount,
  walletPK,
  redis
) => {
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
      const wallet = new ethers.Wallet(walletPK, provider);
      const allowance = await getAllowanceAmount(
        provider,
        address,
        wallet.address,
        wallet.address
      );
      // console.log("ALLOWANCE: ", allowance.toString());

      //
      const ERC20_CONTRACT = new ethers.Contract(address, ERC20_ABI, wallet);

      //
      if (allowance < amount) {
        // let increase = amount - allowance;
        // console.log("INCREASE OK: ", increase.toLocaleString('fullwide', { useGrouping: false }));
        let amountBn = ethers.BigNumber.from(
          amount.toLocaleString("fullwide", { useGrouping: false })
        );
        let allowanceBn = ethers.BigNumber.from(allowance);
        const hexIncrease = amountBn.sub(allowanceBn).toHexString();
        // const hexIncrease = ethers.BigNumber.from(
        //   increase.toLocaleString('fullwide', { useGrouping: false })
        // ).toHexString();
        // console.log("UNISWAP ROUTER ADDRESS: ", UNISWAP_ROUTER_ADDRESS);
        const tx = await ERC20_CONTRACT.populateTransaction.approve(
          wallet.address,
          // +increase.toString()
          hexIncrease
          // {
          //   gasLimit: 100000,
          // }
        );
        // console.log("TX INCREASE ALLOWANCE OK: ", tx);
        // Returns a Promise which resolves to the transaction.
        let sendTxn = await wallet.sendTransaction(tx);

        // console.log({ sendTxn });

        await sendTxn.wait(1);
      }

      //
      const transferTx = await ERC20_CONTRACT.populateTransaction.transferFrom(
        from,
        to,
        amount
      );

      //
      // const signTx = await wallet.sendTransaction(transferTx);
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

      // Logs the information about the transaction it has been mined.
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

        // //
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
        logger.error("TRANSFER TOKEN ERROR");

        //
        resolve(null);
      }
    } catch (e) {
      // // error logging
      // console.error("TRANSFER TOKEN ERROR", e);
      logger.error("TRANSFER TOKEN ERROR: " + e.message);

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

module.exports = { getTokenDecimals, getAllowanceAmount, transferToken };
