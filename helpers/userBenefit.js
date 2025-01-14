const getPointTiers = require("../databases/getPointTiers");
const getWalletData = require("../databases/getWalletData");
const logger = require("./logger");

/**
 * @typedef { object } Output
 * @property { number } userPoint - User point
 * @property { string } tierName - Tier name
 * @property { number } tradingFee - Trading fee
 */

/**
 * userBenefit(msg)
 *
 * @param { object } msg
 * @returns { Promise<Output | null> } Promise of the wallet private key
 */
async function userBenefit(msg) {
  try {
    const walletData = await getWalletData(msg.chat.id);
    const userPoint = walletData.activity_points;
    const pointTier = await getPointTiers();

    //
    let tierName = "";
    let tradingFee = 0;
    let maxPoint = 0;
    let tierId = 0;
    let minPoint = 0;

    //
    for (const tier of pointTier) {
      if (tier.point_min <= userPoint && userPoint < tier.point_max) {
        tierName = tier.tier_name;
        tradingFee = tier.price;
        maxPoint = tier.point_max;
        minPoint = tier.point_min;
        tierId = tier.id;
      } else if (userPoint >= pointTier[pointTier.length - 1].point_min) {
        tierName = pointTier[pointTier.length - 1].tier_name;
        tradingFee = pointTier[pointTier.length - 1].price;
        maxPoint = pointTier[pointTier.length - 1].point_max;
        minPoint = pointTier[pointTier.length - 1].point_min;
        tierId = pointTier[pointTier.length - 1].id;
      }
    }

    //
    const output = {
      userPoint,
      tierName,
      tradingFee,
      maxPoint,
      minPoint,
      tierId,
      consecutiveDay: walletData.consecutive_day,
    };

    //
    return output;
  } catch (e) {
    logger.error("GET USER BENEFIT ERROR: " + e.message);
    return null;
  }
}

module.exports = { userBenefit };
