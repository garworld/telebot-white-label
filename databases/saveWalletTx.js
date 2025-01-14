const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } WalletTransactionsOptions
 * @property { string } chat_id
 * @property { number } chain_id
 * @property { string } wallet_number
 * @property { string } activities
 */

/**
 *
 * @param { WalletTransactionsOptions } options
 * @returns {Promise<boolean}
 */
module.exports = (options) => {
  return new Promise(async (resolve) => {
    try {
      // console.log({ options });
      await prisma.wallet_transactions.create({
        data: {
          chatid: options.chat_id.toString(),
          chain: options.chain_id,
          wallet_number: options.wallet_number,
          activity: options.activity,
        },
      });
      //
      resolve(true);
    } catch (e) {
      logger.error("SAVE WALLET TRANSASACTIONS ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
