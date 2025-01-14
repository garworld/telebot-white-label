const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (chatid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkAutoBuy = await prisma.autobuy.findUnique({
        where: {
          chatid: chatid.toString(),
        },
        select: {
          wallet_used: true,
          amount: true,
          unit: true,
          slippage: true,
          is_private: true,
          is_active: true,
        },
      });
      // console.log({ checkAutoBuy });

      return resolve(checkAutoBuy);
    } catch (err) {
      logger.error("CHECK AUTO BUY ERROR: " + err.message);

      return reject(err);
    }
  });
};
