const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 *
 * @param {String} chat_id
 * @param {Number} chain_id
 * @param {Number} wallet_number
 * @returns
 */

module.exports = (chat_id, chain_id, wallet_number) => {
  return new Promise(async (resolve, reject) => {
    try {
      let wallet;
      switch (wallet_number) {
        case 1:
          wallet = "FIRST";
          break;
        case 2:
          wallet = "SECOND";
          break;
        case 3:
          wallet = "THIRD";
          break;
      }
      const amountTx = await prisma.wallet_transactions.count({
        where: {
          chatid: chat_id.toString(),
          chain: chain_id,
          wallet_number: wallet,
        },
      });
      resolve(amountTx);
    } catch (e) {
      logger.error("GET WALLET TX ERROR: " + e.message);
      reject(e);
    }
  });
};
