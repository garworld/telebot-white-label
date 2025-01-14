const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } walletActivity
 * @property { string } chatid
 * @property { string } wallet_number
 * @property { string } activity
 * @property { Date } activity_time
 * @property { number } volumes
 * @property { number } current_multiplier
 */

/**
 * getWalletActivity24h(chat_id, wallet_number)
 *
 * @param { string } chat_id
 * @param { string } wallet_number
 * @returns
 */
module.exports = (chat_id, wallet_number) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      if (!chat_id) return resolve(null);

      //
      const time_limit = new Date();
      time_limit.setHours(time_limit.getHours() - 24);

      //
      const whereClause = {
        chatid: chat_id.toString(),
        activity_time: {
          gte: time_limit,
        },
      };

      if (wallet_number) {
        whereClause.wallet_number = wallet_number;
      }

      const walletActivity = await prisma.wallet_activity.findMany({
        where: whereClause,
        select: {
          chatid: true,
          wallet_number: true,
          activity: true,
          activity_time: true,
          volumes: true,
          current_multiplier: true,
        },
        orderBy: {
          activity_time: "desc",
        },
      });

      //
      resolve(walletActivity);
    } catch (err) {
      logger.error("GET WALLET ACTIVITY: " + err.message);

      //
      reject(err);
    }
  });
};
