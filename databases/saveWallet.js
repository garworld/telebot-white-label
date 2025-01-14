//

const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * saveWallet(chatid, referralKey, wallets, activity_point, consecutive_day)
 *
 * @param { string } chatid
 * @param { string } referralKey
 * @param { object } wallets
 * @param { number } activity_points
 * @param { number } consecutive_day
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (
  chatid,
  referralKey,
  _wallets,
  activity_point,
  consecutive_day
) => {
  return new Promise(async (resolve) => {
    try {
      //
      const whereClause = {
        chatid: chatid.toString(),
      };
      const createClause = {
        chatid: chatid.toString(),
        //   partone_first: wallets[0].partone.toString("hex"),
        //   partone_second: wallets[1].partone.toString("hex"),
        //   partone_third: wallets[2].partone.toString("hex"),
        //   parttwo_first: wallets[0].parttwo.toString("hex"),
        //   parttwo_second: wallets[1].parttwo.toString("hex"),
        //   parttwo_third: wallets[2].parttwo.toString("hex"),
      };

      //
      if (referralKey) {
        createClause.referral_key = referralKey.toString();
      }
      if (activity_point) {
        createClause.activity_points = activity_point;
      }
      if (consecutive_day) {
        createClause.consecutive_day = consecutive_day;
      }
      // upserting wallets
      await prisma.wallets.upsert({
        where: whereClause,
        create: createClause,
        update: createClause,
      });

      // console.log("UPSERTING KEY OK");

      // return true
      resolve(true);
    } catch (err) {
      // error logging
      logger.error("SAVE WALLET ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
