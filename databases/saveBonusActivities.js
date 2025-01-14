const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (chatid, activity, bonus_point) => {
  return new Promise(async (resolve) => {
    try {
      const updateObject = {
        activity_points: bonus_point,
      };
      const activityCondition = {
        first_buy: "first_buy",
        first_sell: "first_sell",
        first_category: "first_category",
        first_copy: "first_copy",
        first_deposit: "first_deposit",
      };

      if (activityCondition[activity]) {
        updateObject[activityCondition[activity]] = true;
      }
      await prisma.wallets.upsert({
        where: {
          chatid: chatid.toString(),
        },
        update: updateObject,
        create: {
          chatid: chatid.toString(),
          activity_points: bonus_point,
        },
      });

      resolve(true);
    } catch (e) {
      logger.error("UPDATE CONSECUTIVE AND MULTIPLIER: " + e.message);

      //
      resolve(false);
    }
  });
};
