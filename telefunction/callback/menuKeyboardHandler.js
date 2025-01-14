const { AUTOBUY_SETTINGS } = require("../../constants/autobuy");
const {
  BUY_PROCESS_ID,
  BUY_MESSAGE_ID,
  LAST_CHAT,
} = require("../../constants/buytoken");
const { COPYTRADE_SETTINGS } = require("../../constants/copytrade");
const { SNIPE_SETTINGS } = require("../../constants/sniping");

const begin = require("../begin");

module.exports = async ({ bot, redis, msg }) => {
  //
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  const autoBuySettings = await redis.GET(msg.chat.id + AUTOBUY_SETTINGS);
  if (autoBuySettings) {
    await redis.DEL(msg.chat.id + AUTOBUY_SETTINGS);
  }

  //
  const snipeSettings = await redis.GET(msg.chat.id + SNIPE_SETTINGS);
  if (snipeSettings) {
    await redis.DEL(msg.chat.id + SNIPE_SETTINGS);
  }

  //
  const copyTradeSettings = await redis.GET(msg.chat.id + COPYTRADE_SETTINGS);
  if (copyTradeSettings) {
    await redis.DEL(msg.chat.id + COPYTRADE_SETTINGS);
  }

  //
  (await redis.GET(msg.chat.id + BUY_PROCESS_ID))
    ? await redis.DEL(msg.chat.id + BUY_PROCESS_ID)
    : null;
  (await redis.GET(msg.chat.id + BUY_MESSAGE_ID))
    ? await redis.DEL(msg.chat.id + BUY_MESSAGE_ID)
    : null;
  (await redis.GET(msg.chat.id + LAST_CHAT))
    ? await redis.DEL(msg.chat.id + LAST_CHAT)
    : null;
  // (await redis.GET("chainsCache")) ? await redis.DEL("chainsCache") : null;

  //
  begin(bot, msg, redis);
};
