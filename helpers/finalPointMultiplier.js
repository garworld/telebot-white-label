const getWalletActivity24h = require("../databases/getWalletActivity24h");
const getActivityPoint = require("../databases/getActivityPoint");
const getMultiplier = require("../databases/getMultiplier");
const saveWalletActivity = require("../databases/saveWalletActivity");
const logger = require("./logger");
// const redis = require("./redis");
const saveWallet = require("../databases/saveWallet");
// const getRelayMultiplier = require("./relay/getRelayMultiplier");
const getWalletData = require("../databases/getWalletData");
const saveBonusActivities = require("../databases/saveBonusActivities");
const checkReference = require("../databases/checkReference");
const saveReferralPoint = require("../databases/saveReferralPoint");
const saveReferrerPoint = require("../databases/saveReferrerPoint");
const updateConsecutiveDay = require("../databases/updateConsecutiveDay");

async function finalPointMultiplier(
  chat_id,
  wallet_used,
  activities,
  amount,
  chainid,
  wallet_address,
  msg,
  redis,
  isUSD
) {
  try {
    // get wallet data and activity point
    const ethusd = await redis.GET("ethusd");
    const avausd = await redis.GET("avausd");

    let usdPrice = ethusd;

    if (Number(chainid) === 43114) {
      usdPrice = avausd;
    }
    const getActPoint = await getActivityPoint(activities);
    let walletData = await getWalletData(msg.chat.id);

    // check bonus activities
    const bonusActivities = [
      {
        activity: "BUYTOKEN",
        first_activity: "FIRSTBUYTOKEN",
        data: "first_buy",
      },
      {
        activity: "SELLTOKEN",
        first_activity: "FIRSTSELLTOKEN",
        data: "first_sell",
      },
      {
        activity: "CATEGORYBUY",
        first_activity: "FIRSTCATEGORYBUY",
        data: "first_category",
      },
      {
        activity: "COPYTRADE",
        first_activity: "FIRSTCOPYTRADE",
        data: "first_copy",
      },
    ];

    let count = 0;
    let maxcount = bonusActivities.length;
    let checkBonus = async function (a, b) {
      if (a < b) {
        if (
          activities == bonusActivities[count].activity &&
          !walletData[bonusActivities[count].data]
        ) {
          const bonusPoint = await getActivityPoint(
            bonusActivities[count].first_activity
          );
          const totalPoint = walletData.activity_points + bonusPoint.point;
          await saveBonusActivities(
            msg.chat.id,
            bonusActivities[count].data,
            totalPoint
          );
          walletData = await getWalletData(msg.chat.id);
        }
        count++;
        checkBonus(count, maxcount);
      }
    };

    checkBonus(count, maxcount);

    if (getActPoint) {
      // count base point
      const usdAmount = isUSD ? amount : amount * usdPrice;
      const basePoint = usdAmount * getActPoint.point;

      // last 24h tx check
      const txCheck24h = await getWalletActivity24h(chat_id);
      let consecutiveDayIncrement = 1;

      let multiplier;
      if (txCheck24h && txCheck24h.length > 0) {
        // check the date of last transaction
        const lastTxTime = new Date(txCheck24h[0].activity_time);
        const today = new Date();

        if (
          lastTxTime.getFullYear() === today.getFullYear() &&
          lastTxTime.getMonth() === today.getMonth() &&
          lastTxTime.getDate() === today.getDate()
        ) {
          consecutiveDayIncrement = 0;
        }

        // check active wallet last 24h
        const walletNumberSet = new Set(
          txCheck24h.map((item) => item.wallet_number)
        );
        const walletUsage = walletNumberSet.size;

        // get multiplier based on active wallet and consec day
        multiplier = await getMultiplier(
          chainid,
          walletData.consecutive_day + consecutiveDayIncrement,
          walletUsage
        );
      } else {
        // get lowest multiplier
        multiplier = await getMultiplier(chainid, 0, 1);
        await updateConsecutiveDay(msg.chat.id, 0);
      }

      // save wallet activity
      const options = {
        chat_id: chat_id,
        wallet_number: wallet_used,
        activities: activities,
        volumes: basePoint,
        current_multiplier: multiplier?.multiplication,
      };

      const saveActivity = await saveWalletActivity(options);

      if (saveActivity) {
        // get relay multiplier if tx on arbitrum chain
        let relay_multipilier = 1;

        if (Number(chainid) === 42161) {
          // relay_multipilier = await getRelayMultiplier(msg.chat.id);
        }

        // count total multiplier
        const total_multiplier = multiplier?.multiplication * relay_multipilier;

        // count total point and save to db wallets
        const total_activity_point = basePoint * total_multiplier;
        const total_point =
          Number(walletData.activity_points) + total_activity_point;

        await saveWallet(
          msg.chat.id,
          null,
          null,
          total_point,
          multiplier?.consecutive_day
        );

        const reference = await checkReference(msg.chat.id.toString());

        if (reference) {
          await saveReferralPoint(
            msg.chat.id.toString(),
            reference,
            Number(total_point)
          );
          await saveReferrerPoint(reference, Number(total_point));
        }

        // return total_multiplier;
        return true;
      } else {
        // throw new Error("SAVE ACTIVITY FAILED");
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    console.error("FINAL POINT MULTIPLIER ERROR: ", e);
    // logger.error("FINAL POINT MULTIPLIER ERROR: " + e.message);
    return false;
  }
}

module.exports = { finalPointMultiplier };
