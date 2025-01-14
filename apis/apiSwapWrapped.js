const { wallet_number } = require("@prisma/client");
const { ethers } = require("ethers");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const checkBalance = require("../helpers/checkBalance");
const { WRAPPED_NATIVE_CURRENCY } = require("@uniswap/smart-order-router");
const redis = require("../helpers/redis");
const logger = require("../helpers/logger");
const getWallet = require("../databases/getWallet");
const buyTokenUseETH1Inch = require("../helpers/buy-1inch");

const apiSwapWrapped = async function (request, reply) {
  try {
    const { chain_used, wallet_used, amount, isPrivate, slippage } = request.body;

    const chat_id = request.chatId;

    if (!amount) {
      return reply.code(400).send({
        message: "Amount Must be Set",
      });
    }

    if (isNaN(amount)) {
      return reply.code(400).send({
        message: "Wrong Input Amount",
      });
    }

    if (!chain_used) {
      return reply.code(400).send({
        message: "Chain Not Found",
      });
    }

    if (Number(chain_used) === 1088 || Number(chain_used) === 1399811149) {
      return reply.code(400).send({
        message: "Chain Unsupported",
      });
    }

    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    //
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    const walletPk = await getWallet(chat_id, wallet_used ? Number(wallet_used) : wallet_number.FIRST, chainIdx);
    const wallet = new ethers.Wallet(walletPk);

    // provider
    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainIdx].rpc_provider
    );

    // check balance
    const userBalance = await checkBalance(provider, wallet.address);

    if (Number(userBalance.balance) < Number(amount)) {
      return reply.code(400).send({
        message: "Insufficient Balance",
      });
    }

    const res = await buyTokenUseETH1Inch(
      chainIdx,
      walletPk,
      WRAPPED_NATIVE_CURRENCY[chain_used].address,
      amount,
      slippage ? slippage.toString() : null,
      isPrivate,
      {
        chat: {
          id: chat_id,
        },
      },
      Number(wallet_used),
      chains,
      redis,
      null
    );

    return reply.code(200).send(res);
  } catch (e) {
    logger.error("API SWAP WRAPPED ERROR: " + e.message);

    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiSwapWrapped;
