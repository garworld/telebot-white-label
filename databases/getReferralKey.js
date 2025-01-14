const { logger, prisma } = require("../helpers");

/**
 * @typedef { object } ReferralKey
 * @property { BigInt } id
 * @property { string } chatId
 * @property { string } key
 */

/**
 * getReferralKey
 * @param { string } chatid
 * @returns { Promise<ReferralKey | null> }
 */
module.exports = (chatid) => {
  return new Promise(async (resolve) => {
    try {
      if (chatid) {
        const data = await prisma.wallets.findUnique({
          where: {
            chatid: chatid.toString(),
          },
          select: {
            id: true,
            chatid: true,
            referral_key: true,
          },
        });

        if (data) {
          const dataValue = {
            id: data?.id,
            chatId: data?.chatid,
            key: data?.referral_key,
          };

          return resolve(dataValue);
        } else {
          return resolve(null);
        }
      } else {
        return resolve(null);
        // return reject("Missing parameter");
      }
    } catch (err) {
      logger.error("GET REFERRAL KEY; " + err.message);

      return resolve(null);
      // reject(err);
    }
  });
};
