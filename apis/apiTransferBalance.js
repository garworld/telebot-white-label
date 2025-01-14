const { ethers } = require("ethers");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const { PublicKey } = require("@solana/web3.js");
const { transferETH } = require("../helpers/ethHelper");
const redis = require("../helpers/redis");
const { transferSOL } = require("../helpers/solana/transferSol");
const { transferToken } = require("../helpers/tokenHelper");
const { transferTokenSol } = require("../helpers/solana/transferTokenSol");

const apiTransferBalance = async (request, reply) => {
  const {
    chain_used,
    wallet_number,
    wallet_dest,
    amount,
    symbol,
    token_address,
    token_decimals,
  } = request.body;
  const chat_id = request.chatId;
  const nativeSymbol = ["ETH", "SOL", "ARB", "AVAX", "METIS"];
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    // get wallet
    const gettingWallet = await getWallet(
      chat_id,
      Number(wallet_number),
      chainIdx
    );

    // get wallet address
    let the_wallet = null;
    if (chainIdx !== 4) {
      the_wallet = new ethers.Wallet(gettingWallet);
    } else {
      const accounts = await gettingWallet.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      the_wallet = { address: publicKey.toBase58() };
    }

    //
    let response, message;
    const isNative = nativeSymbol.includes(symbol);
    if (isNative) {
      if (chainIdx !== 4) {
        response = await transferETH(
          chainIdx,
          wallet_dest,
          amount.toString(),
          gettingWallet,
          redis
        );
      } else {
        response = await transferSOL(
          chainIdx,
          wallet_dest,
          amount,
          gettingWallet,
          redis
        );
      }
    } else {
      if (chainIdx !== 4) {
        //
        const hexAmount = ethers.BigNumber.from(
          (amount * 10 ** token_decimals).toLocaleString("fullwide", {
            useGrouping: false,
          })
        ).toHexString();
        //
        response = await transferToken(
          chainIdx,
          token_address,
          the_wallet.address,
          wallet_dest,
          hexAmount,
          gettingWallet,
          redis
        );
      } else {
        response = await transferTokenSol(
          chainIdx,
          wallet_dest,
          token_address,
          amount,
          gettingWallet,
          redis
        );
      }
    }

    if (response) {
      if (response.hash) {
        message = "Transfer Success";
      } else {
        message = `Transfer Fail, please try again later`;
      }
    } else {
      message = `Transfer Fail, please try again later`;
    }

    reply.code(200).send({
      message: message,
      data: response,
    });
  } catch (e) {
    console.error(e);
    logger.error("API TRANSFER BALANCE ERROR: " + e.message);
    reply.code(200).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTransferBalance;
