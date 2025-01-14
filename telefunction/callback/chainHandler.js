const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const {
  COINGECKO_CATEGORY_ID,
  COINGECKO_CATEGORY_NAME,
} = require("../../constants/coingecko");
const begin = require("../begin");

module.exports = async ({ bot, redis, action, msg }) => {
  //
  // bot.deleteMessage(msg.chat.id, msg.message_id);

  // get chains
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  // console.log("CHAINS: ", chains);
  // console.log({ action });
  const cidx = chains.findIndex(
    (x) => Number(action.split(":")[1]) === x.chain_id
  );
  // console.log("CHAIN INDEX: ", cidx);

  //
  if (cidx > -1) {
    await redis.SET(msg.chat.id + CHAIN_USED, cidx);

    // reset category name and id
    await redis.DEL(msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED);
    await redis.DEL(msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED);
  }

  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  chains[chainused].text += " \u2705";

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
  // begin(bot, msg);
  bot.editMessageReplyMarkup(
    {
      inline_keyboard: inlineKeyboardButton,
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
