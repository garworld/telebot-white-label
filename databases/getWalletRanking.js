const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (chatid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const walletRanking = await prisma.wallets.findMany({
        select: {
          chatid: true,
          activity_points: true,
          consecutive_day: true,
        },
        orderBy: {
          activity_points: "desc",
        },
      });

      // get user rank
      const userIndex = walletRanking.findIndex(
        (wallet) => wallet.chatid === chatid.toString()
      );

      //
      if (userIndex == -1) {
        return resolve(null);
      }

      const userRanking = {
        userWallet: walletRanking[userIndex],
        userRanking: userIndex + 1,
      };
      return resolve(userRanking);
    } catch (e) {
      logger.error("GET WALLET RANKING " + e.message);

      //
      reject(e);
    }
  });
};
