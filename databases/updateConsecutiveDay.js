//
require("dotenv").config();

//
const prisma = require("../helpers/prisma");
const logger = require("../helpers/logger");

/**
 * updateWebhook(webhookid, address, isAddition)
 *
 * @param { string } chatid
 * @param { number } consecutive_day
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (chatid, consecutive_day) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      await prisma.wallets.update({
        where: {
          chatid: chatid.toString(),
        },
        data: {
          consecutive_day: consecutive_day,
        },
      });

      // return true
      resolve(true);
    } catch (err) {
      // error logging
      logger.error("UPDATE CONSECUTIVE DAY ERROR: " + err.message);

      // return false
      reject(false);
    }
  });
};
