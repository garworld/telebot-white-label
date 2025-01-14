const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (reference) => {
  return new Promise(async (resolve) => {
    try {
      const referralBenefit = await prisma.referral_point.findMany({
        where: {
          reference: reference.toString(),
        },
        select: {
          chatid: true,
          activity_point: true,
        }
      });

      if (referralBenefit) {
        if (referralBenefit.length > 0) {
          let referralPoints = 0;
          const countingBenefit = referralBenefit.map((b) => {
            referralPoints += Number(b.activity_point);
          });

          await Promise.all([countingBenefit]);

          return resolve(referralPoints);
        }
      }

      return resolve(0);
    } catch (e) {
      logger.error("SAVE REFERRAL POINT ERROR: " + e.message);

      //
      return resolve(0);
    }
  });
};
