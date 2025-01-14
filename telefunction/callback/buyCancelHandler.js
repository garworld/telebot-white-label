const {
  BUY_OPTIONS_ID,
  BUY_MESSAGE_MENU,
} = require("../../constants/buytoken");
const balanceInfo = require("../balanceInfo");
const begin = require("../begin");

module.exports = async ({ bot, msg, redis }) => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  // begin(bot, msg, redis);
  let message = await balanceInfo(msg, redis);

  const buy_options = JSON.parse(await redis.GET(msg.chat.id + BUY_OPTIONS_ID));
  // console.log({ buy_options });

  const inline_keyboard = buy_options.reply_markup.inline_keyboard;
  // console.log(inline_keyboard);

  const buyMsg = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard,
    },
  });

  await redis.SET(msg.chat.id + BUY_MESSAGE_MENU, buyMsg.message_id);
};
