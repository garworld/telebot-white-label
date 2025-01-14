const { copy_type } = require("@prisma/client");

const { copyTradePage } = require("../../modes");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const { saveCopycat } = require("../../../databases");

module.exports = async ({ bot, redis, msg, chains }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

  //
  let copyPreparation = {
    chain: chains[chainused].chain_id,
    wallet_used: [],
    copy_type: copy_type.EXACT,
    copy_buy: false,
    copy_sell: false,
    limit_amount: 0.1,
    profit_sell: false,
    targets: [],
  }

  //
  const theCopyCache = await redis.GET(msg.chat.id + COPYTRADE_SETTINGS);

  //
  if (theCopyCache) {
    copyPreparation = JSON.parse(theCopyCache);
    // console.log("CACHE: ", copyPreparation);

    copyPreparation.profit_sell = !copyPreparation.profit_sell;
  }

  await redis.SET(
    msg.chat.id + COPYTRADE_SETTINGS,
    JSON.stringify(copyPreparation)
  );

  //
  await saveCopycat(
    msg.chat.id,
    chains[chainused].chain_id,
    {
      chain: copyPreparation.chain,
      wallet_used: copyPreparation.wallet_used,
      copy_type: copyPreparation.copy_type,
      copy_buy: copyPreparation.copy_buy,
      copy_sell: copyPreparation.copy_sell,
      limit_amount: copyPreparation.limit_amount,
      profit_sell: copyPreparation.profit_sell,
    }
  );

  // default inline keyboard
  const defaultInlineKey = copyTradePage(copyPreparation);

  // console.log({
  //   inline_keyboard: defaultInlineKey[2],
  // });

  bot.editMessageReplyMarkup(
    {
      inline_keyboard: defaultInlineKey,
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
