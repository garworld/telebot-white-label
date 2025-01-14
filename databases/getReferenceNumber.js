const { logger, prisma } = require("../helpers");

/**
 * getReferenceNumber
 * @param { string } chatid
 * @returns { Promise<number> }
 */
module.exports = (chatid) => {
  return new Promise(async (resolve) => {
    try {
      const data = await prisma.reference.count({
        where: {
          referrer: chatid.toString(),
        }
      });

      if (data) {
        return resolve(data);
      } else {
        return resolve(0);
      }
    } catch (err) {
      logger.error("GET REFERRAL NUMBER ERROR: " + err.message);

      return resolve(0);
    }
  });
};
