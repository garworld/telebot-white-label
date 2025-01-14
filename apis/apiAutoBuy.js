const { wallet_number } = require("@prisma/client");

const logger = require("../helpers/logger");
const upsertAutoBuy = require("../databases/upsertAutoBuy");

const apiAutoBuy = async function (request, reply) {
  try {
    const { 
      wallets,
      amount,
      slippage,
      isPrivate,
      isActive,
    } = request.body;

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

    // console.log({ chain_used, symbol, from, to, amount, slippage });
  
    const data = {
      walletUsed: wallets ? wallets.split(',') : [wallet_number.FIRST],
      amount: Number(amount),
      unit: null,
      slippage: slippage ? slippage : 10,
      isPrivate: isPrivate ? (isPrivate === 'true' ? true : false) : false,
      isActive: isActive ? (isActive === 'true' ? true : false) : false,
    };

    const upsertingAutoBuy = await upsertAutoBuy(chat_id, data);

    if (!upsertingAutoBuy) {
      //
      return reply.code(400).send({
        message: "Failed Setting Auto Buy",
      });
    }

    //
    return reply.code(200).send({
      message: "Success Setting Auto Buy",
    });
  } catch (e) {
    // console.error(e);
    logger.error("API AUTO BUY ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiAutoBuy;
