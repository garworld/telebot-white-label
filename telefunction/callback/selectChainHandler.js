const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const { DATA_CHAIN_LIST } = require("../../constants/chains");

module.exports = async ({ bot, msg, redis }) => {
  //
  bot.deleteMessage(msg.chat.id, msg.message_id);

  // get chains
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

  // console.log({ DATA_CHAIN_LIST });

  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  // get chain used
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  // console.log("DISINIS", {
  //   chains, chainused
  // });

  //
  chains[chainused].text += " \u2705";

  //
  const message = "<strong>Which chain would you wish to connect to?</strong>";

  //
  const inlineKeyboardButton = chains.map((val) => [
    {
      text: val.text,
      callback_data: val.callback_data,
    },
  ]);

  inlineKeyboardButton.unshift([
    {
      text: "\u21B6 Save and Close",
      callback_data: MENU_KEYBOARD_CALLBACK_DATA,
    },
  ]);

  //
  bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: inlineKeyboardButton,
    },
  });
};
