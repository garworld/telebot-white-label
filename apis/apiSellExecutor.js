const { ethers } = require("ethers");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const sellTokenOpenOcean = require("../helpers/sell-openOcean");
const { PublicKey } = require("@solana/web3.js");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const redis = require("../helpers/redis");
const sellTokenJupiter = require("../helpers/solana/sell-Jupiter");
const sellTokenForETH1Inch = require("../helpers/sell-1inch");

const apiSellExecutor = async (request, reply) => {
  const { chain_used, wallet_used, from, to, amount, slippage } = request.body;
  const chat_id = request.chatId;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    // get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used), chainIdx);

    //
    let the_wallet = null;
    if (chainIdx !== 4) {
      the_wallet = new ethers.Wallet(wallet_pk);
    } else {
      // const keypair = createWalletFromPrivateKey(wallet_pk);
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      the_wallet = publicKey.toBase58();
    }

    const isPrivate = null;
    let response = null;
    switch (chainIdx) {
      case 3:
        response = await sellTokenOpenOcean(
          chainIdx,
          wallet_pk,
          from,
          amount,
          slippage,
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          redis,
          to === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? null : to
        );
        break;
      case 4:
        response = await sellTokenJupiter(
          chainIdx,
          wallet_pk,
          from,
          amount,
          slippage,
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          to === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? null : to
        );
        break;
      default:
        response = await sellTokenForETH1Inch(
          chainIdx,
          wallet_pk,
          from,
          amount,
          slippage,
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          redis,
          to === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? null : to
        );
    }

    //
    let message;
    if (response.hash) {
      message = "Sell Success";
    } else {
      message = `Sell Fail, ${response.error}`;
    }

    reply.code(200).send({
      message: message,
      data: response,
    });
  } catch (e) {
    console.error(e);
    logger.error("API SELL EXECUTOR ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiSellExecutor;
