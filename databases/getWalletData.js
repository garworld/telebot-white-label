const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (chat_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (chat_id) {
        //
        const walletData = await prisma.wallets.findUnique({
          where: {
            chatid: chat_id.toString(),
          },
          select: {
            chatid: true,
            first_buy: true,
            first_sell: true,
            first_category: true,
            first_copy: true,
            first_deposit: true,
            activity_points: true,
            consecutive_day: true,
          },
        });
        return resolve(walletData);
      } else {
        throw new Error("Missing Parameter");
      }
    } catch (e) {
      logger.error("GET WALLET DATA: " + e.message);

      //
      reject(e);
    }
  });
};
