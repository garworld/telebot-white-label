//
require("dotenv").config();

//
const prisma = require("../helpers/prisma");
const logger = require("../helpers/logger");

/**
 * updateWebhook(webhookid, address, isAddition)
 *
 * @param { string } chatid
 * @param { number } points
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (chatid, points) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      await prisma.wallets.update({
        where: {
          chatid: chatid.toString(),
        },
        data: {
          activity_points: {
            increment: Number(points),
          }
        }
      })

      // return true
      resolve(true);
    } catch (err) {
      // error logging
      logger.error("UPDATE POINT ERROR: " + err.message);

      // return false
      reject(false);
    }
  });
};
