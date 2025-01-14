const {
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
} = require("../../constants/buytoken");
const getPointTiers = require("../../databases/getPointTiers");
const { userBenefit } = require("../../helpers/userBenefit");
const getWalletActivity24h = require("../../databases/getWalletActivity24h");
const getMultiplier = require("../../databases/getMultiplier");
// const redis = require("../../helpers/redis");
const { botdb } = require("../../databases");
const getRelayMultiplier = require("../../helpers/relay/getRelayMultiplier");
const { POINT_PERCENTAGE_NOTE } = require("../../constants/espoinagePoints");
const getWalletRanking = require("../../databases/getWalletRanking");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const updateConsecutiveDay = require("../../databases/updateConsecutiveDay");
const { DATA_CHAIN_LIST } = require("../../constants/chains");

module.exports = async ({ bot, msg, redis }) => {
  //
  const chainIdx = (await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
  // const chains = DATA_CHAIN_LIST;
  const chainId = chains[Number(chainIdx)].chain_id;

  const getUserBenefit = await userBenefit(msg);
  const pointTiers = await getPointTiers();

  // get data to display

  const nextTierIdx = getUserBenefit?.tierId;
  const nextTiers = pointTiers[nextTierIdx];
  const txCheck24h = await getWalletActivity24h(msg.chat.id);
  let walletUsage = 1;
  if (txCheck24h && txCheck24h.length > 0) {
    // check active wallet last 24h
    const walletNumberSet = new Set(
      txCheck24h.map((item) => item.wallet_number)
    );
    walletUsage = walletNumberSet.size;
  } else {
    await updateConsecutiveDay(msg.chat.id, 0);
  }
  //
  const pointRemaining = getUserBenefit?.maxPoint
    ? getUserBenefit?.maxPoint - getUserBenefit?.userPoint
    : null;

  const poinRemainingMessage = pointRemaining
    ? `${pointRemaining.toFixed(0)} Points remaining for\n`
    : "You've reached the maximum tier\n----------------------------\n";

  const nextTierMessage = pointRemaining
    ? `Next Tier: ${
        nextTiers?.tier_name ? nextTiers?.tier_name : "Maximum Tier"
      }\n----------------------------\n`
    : "";
  // get multiplier of wallet usage
  const walletUsageMultiplier = await getMultiplier(chainId, 0, walletUsage);

  // get daily streak multiplier
  let consecDay = 0;
  let consecDayIncrement = 0;
  if (txCheck24h.length > 0) {
    consecDay = getUserBenefit.consecutiveDay;
    // check the date of last transaction
    const lastTxTime = new Date(txCheck24h[0].activity_time);
    const today = new Date();

    if (
      lastTxTime.getFullYear() === today.getFullYear() &&
      lastTxTime.getMonth() === today.getMonth() &&
      lastTxTime.getDate() === today.getDate()
    ) {
      consecDayIncrement = 0;
    } else {
      consecDayIncrement = 1;
    }
  }
  // console.log({ consecDayIncrement });

  const dailyMultiplier = await getMultiplier(
    chainId,
    consecDay + consecDayIncrement,
    1
  );
  console.log({ dailyMultiplier });

  // get relay multiplier
  // let relayMultiplier = [];
  // for (let i = 1; i <= 3; i++) {
  //   const checkWallet = botdb.get([msg.chat.id, i]);
  //   const multiplierData = await getRelayMultiplier(checkWallet);
  //   relayMultiplier.push(multiplierData);
  // }

  // const finalRelayMultiplier = relayMultiplier.reduce((a, b) => a * b, 1);

  let finalRelayMultiplier = 1;
  if (chainIdx == "1") {
    finalRelayMultiplier = await getRelayMultiplier(msg.chat.id);
  }

  //
  const finalPointMultiplier =
    dailyMultiplier?.multiplication *
    walletUsageMultiplier.multiplication *
    finalRelayMultiplier;

  //count percentage of espoinage point
  const pointTierDiff = getUserBenefit?.maxPoint - getUserBenefit?.minPoint;
  const userPointDiff = getUserBenefit?.userPoint - getUserBenefit?.minPoint;
  const percentage =
    getUserBenefit?.maxPoint === null
      ? 100
      : (userPointDiff / pointTierDiff) * 100 || 0;

  // note display based on percentage
  let noteValue = POINT_PERCENTAGE_NOTE["0-10"];
  for (const note in POINT_PERCENTAGE_NOTE) {
    if (Object.hasOwnProperty.call(POINT_PERCENTAGE_NOTE, note)) {
      const val = POINT_PERCENTAGE_NOTE[note];
      if (note.includes("-")) {
        const [min, max] = note.split("-");
        if (percentage >= +min && percentage <= max) {
          noteValue = val;
        }
      } else {
        noteValue = val;
      }
    }
  }

  //agent ranking
  const ranking = await getWalletRanking(msg.chat.id);

  //count discount fee
  const discountFee = (1 - getUserBenefit.tradingFee) * 100;
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  let message = "<strong>Tier Level:</strong>\n";
  message += `<strong>${getUserBenefit?.tierName}</strong>\n----------------------------\n`;
  message += `Espionage Points: ${getUserBenefit?.userPoint?.toFixed(0)}\n\n`;
  message += `${noteValue} ${percentage?.toFixed(2)}%\n`;
  message += poinRemainingMessage;
  message += nextTierMessage;
  message += `Agent Rank: ${ranking?.userRanking}\n`;
  message += `Fee Discount: ${discountFee?.toFixed(
    0
  )}%\n----------------------------\n`;
  message += `Daily Streak Multiplier: ${dailyMultiplier?.multiplication}x\n`;
  message += `Wallet Usage Multiplier: ${walletUsageMultiplier?.multiplication}x\n`;
  message += `RELAY Ownership Multiplier: ${finalRelayMultiplier}x\n`;
  message += `Final Point Multiplier: ${formatNumber(
    finalPointMultiplier
  )}x\n----------------------------\n`;
  message += "<i>Earn more points to pay less fee.</i>\n";
  message += `<a href="https://docs.jamesbot.ai/espionage-points/points-explained"><i>Learn more</i></a>\n`;

  //
  bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u2261 Menu",
            callback_data: MENU_KEYBOARD_CALLBACK_DATA,
          },
        ],
        [
          {
            text: "Referral",
            callback_data: "!referral",
          },
        ],
      ],
    },
  });
};
