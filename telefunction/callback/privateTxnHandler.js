const { PRIVATE_SELECT, PRIVATE_TXN } = require("../../constants/buytoken");

module.exports = async ({ bot, msg, redis, action }) => {
  const currentInlineKeyboard = msg.reply_markup.inline_keyboard;

  const source = action.split(PRIVATE_TXN)[1];

  const isPrivateRedis = await redis.GET(msg.chat.id + PRIVATE_SELECT + source);

  const isPrivate = isPrivateRedis ? JSON.parse(isPrivateRedis) : false;

  if (source === "buy") {
    currentInlineKeyboard[10][0].text =
      !isPrivate == false ? "🔴 Private Txn" : "🟢 Private Txn";
  }

  if (source === "sell") {
    currentInlineKeyboard[9][0].text =
      !isPrivate == false ? "🔴 Private Txn" : "🟢 Private Txn";
  }

  if (source === "category") {
    currentInlineKeyboard[10][0].text =
      !isPrivate == false ? "🔴 Private Txn" : "🟢 Private Txn";
  }

  await redis.SET(
    msg.chat.id + PRIVATE_SELECT + source,
    (!isPrivate).toString()
  );

  bot.editMessageReplyMarkup(
    {
      inline_keyboard: currentInlineKeyboard,
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
