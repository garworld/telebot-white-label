const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } Multiplier
 * @property { number } chain
 * @property { number } consecutive_day
 * @property { number } used_wallet
 * @property { number } multiplication
 * @property { Date } starting_at
 */

/**
 * getMultiplier(consecutive_day,used_wallet)
 *
 * @param { number } chainid
 * @param { number } consecutive_day
 * @param { number } used_wallet
 * @returns {Promise<Multiplier>}
 */
module.exports = (chainid, consecutive_day, used_wallet) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        chainid !== undefined &&
        consecutive_day !== undefined &&
        used_wallet !== undefined
      ) {
        let adjust_consecutive_day = consecutive_day;
        if (consecutive_day > 10) {
          adjust_consecutive_day = 10;
        }
        const multiplier = await prisma.multiplier.findFirst({
          where: {
            chain: chainid,
            consecutive_day: adjust_consecutive_day,
            used_wallet: used_wallet,
          },
          select: {
            chain: true,
            consecutive_day: true,
            used_wallet: true,
            multiplication: true,
            starting_at: true,
          },
        });
        return resolve(multiplier);
      } else {
        throw new Error("Missing Parameter");
      }
    } catch (err) {
      logger.error("GET MULTIPLIER: " + err.message);

      //
      reject(err);
    }
  });
};
