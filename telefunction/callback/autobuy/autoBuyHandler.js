//
const { AUTOBUY_SETTINGS } = require("../../../constants/autobuy");
const { autoBuyPage } = require("../../modes");
const { autoBuyMessage } = require("../../messages");
const { getAutoBuy } = require("../../../databases");
const { CHAIN_USED } = require("../../../constants/buytoken");

module.exports = async ({ bot, msg, redis }) => {
  // remove last message
  if (msg.message_id) {
    bot.deleteMessage(msg.chat.id, msg.message_id);
  }

  //
  const chainused = Number(await redis.GET(msg.chat_id + CHAIN_USED)) || 0;

  //
  const autoBuyProperties = await getAutoBuy(msg.chat.id);

  //
  await redis.SET(msg.chat.id + AUTOBUY_SETTINGS, JSON.stringify(autoBuyProperties));

  //
  autoBuyProperties.chainused = chainused;

  // default inline keyboard
  const defaultInlineKey = autoBuyPage(autoBuyProperties);

  //
  const message = autoBuyMessage();

  //
  await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: defaultInlineKey,
    },
  });
};
