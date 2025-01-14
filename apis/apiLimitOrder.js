const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const { limitOrderEvm, limitOrderSolana } = require("../helpers/limitOrder");

const apiLimitOrder = async function (request, reply) {
  try {

    const { chainId, inToken, inAmount, outToken, outAmount, expiredAt, priorityFee, walletUsed } = request.body;

    const chat_id = request.chatId;

    // console.log({ chain_used, symbol, from, to, amount, slippage });
  
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chainId)];

    const walletPk = await getWallet(chat_id, walletUsed ? Number(walletUsed) : 1, chainIdx);

    let response = null;

    switch (chainIdx) {
      case 3:
        response = null;
        break;
      case 4:
        response = await limitOrderSolana(chainIdx, inToken, inAmount, outToken, outAmount, walletPk, expiredAt, priorityFee);
        break;
      default:
        response = await limitOrderEvm(chainIdx, inToken, inAmount, outToken, outAmount, walletPk, expiredAt);
    }

    //
    return reply.code(200).send({
      data: response,
    });
  } catch (e) {
    // console.error(e);
    logger.error("API LIMIT ORDER ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiLimitOrder;
