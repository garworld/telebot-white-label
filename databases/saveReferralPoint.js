const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (chatid, reference, points) => {
  return new Promise(async (resolve) => {
    try {
      await prisma.referral_point.create({
        data: {
          chatid: chatid.toString(),
          activity_point: Number(points),
          reference: reference.toString(),
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
