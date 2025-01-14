const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const getWallet = require("../databases/getWallet");
const buyTokenUseETH1Inch = require("../helpers/buy-1inch");
const buyTokenJupiter = require("../helpers/solana/buy-Jupiter");
const buyOpenOcean = require("../helpers/buy-openOcean");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");

const apiBuyExecutor = async (request, reply) => {
  const { chain_used, wallet_used, amount, slippage, to, from, symbol } =
    request.body;
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

    // get chat id
    const chat_id = request.chatId;

    //
    const unitName = symbol === "USDT" || symbol === "USDC" || symbol === "USDt" ? 6 : 18;

    //get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used), chainIdx);
    let wallet = null;
    if (chainIdx !== 4) {
      wallet = new ethers.Wallet(wallet_pk);
    } else {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      wallet = { address: publicKey.toBase58() };
    }

    //platform fee
    let amountIn = ethers.utils.parseUnits(amount.toString(), unitName);
    const platformFee = amountIn.div(100);
    amountIn = amountIn.sub(platformFee);
    const amountFormat = ethers.utils.formatUnits(amountIn, unitName);

    const isPrivate = null;

    let res = null;
    switch (chainIdx) {
      case 3:
        res = await buyOpenOcean(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "METIS" ? null : from
        );
        break;
      case 4:
        res = await buyTokenJupiter(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "SOL" ? null : from
        );
        break;
      default:
        res = await buyTokenUseETH1Inch(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "ETH" || symbol === "AVAX" ? null : from
        );
    }
    let message;
    if (res.hash) {
      message = "Buy Success";
    } else {
      message = `Buy Fail, ${res.error}`;
    }

    reply.code(200).send({
      message: message,
      data: res,
    });
  } catch (e) {
    console.error(e);
    logger.error("API BUY EXECUTOR ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiBuyExecutor;
