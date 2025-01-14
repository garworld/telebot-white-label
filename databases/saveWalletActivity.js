const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } WalletActivityOptions
 * @property { string } chat_id
 * @property { string } wallet_number
 * @property { string } activities
 * @property { Date } activity_time
 * @property { number } volumes
 * @property { number } current_multiplier
 */

/**
 * saveWalletActivity(options)
 *
 * @param { WalletActivityOptions } options
 * @returns { Promise<boolean> }
 */

module.exports = (options) => {
  return new Promise(async (resolve) => {
    try {
      await prisma.wallet_activity.create({
        data: {
          chatid: options.chat_id.toString(),
          wallet_number: options.wallet_number,
          activity: options.activities,
          activity_time: new Date(),
          volumes: options.volumes,
          current_multiplier: options.current_multiplier,
        },
      });

      //
      resolve(true);
    } catch (e) {
      logger.error("SAVE WALLET ACTIVITY: " + e.message);

      //
      resolve(false);
    }
  });
};
