const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (referrer, points) => {
  return new Promise(async (resolve) => {
    try {
      await prisma.wallets.update({
        where: {
          chatid: referrer.toString(),
        },
        data: {
          activity_points: {
            increment: Number(points),
          }
        }
      });

      resolve(true);
    } catch (e) {
      logger.error("SAVE REFERRAL POINT ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
