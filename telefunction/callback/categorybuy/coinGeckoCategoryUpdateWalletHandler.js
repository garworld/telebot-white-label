const {
  COINGECKO_WALLET_INDEX,
  COINGECKO_CATEGORY_UPDATE_WALLET,
  COINGECKO_SAVED_CATEGORY_TOKENS,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, redis, action, msg }) => {
  const currentWalletIndex = await redis.GET(
    msg.chat.id + COINGECKO_WALLET_INDEX
  );

  // handle wallet index update here
  const walletIndex = action.replace(COINGECKO_CATEGORY_UPDATE_WALLET, "");

  // guard for clicking same wallet
  if (currentWalletIndex === walletIndex) {
    return;
  }

  await redis.SET(msg.chat.id + COINGECKO_WALLET_INDEX, walletIndex);

  const inline_keyboard = msg.reply_markup.inline_keyboard;
  const editIndex = inline_keyboard.findIndex((x) =>
    x[0].text.includes("wallet-")
  );
  const walletIndexes = Array.from(Array(3).keys());

  const displayWallets = walletIndexes.map((index) => {
    return {
      text:
        index.toString() === walletIndex
          ? `\u2705 wallet-${index + 1}`
          : `wallet-${index + 1}`,
      callback_data: `${COINGECKO_CATEGORY_UPDATE_WALLET}${index}`,
    };
  });

  inline_keyboard.splice(editIndex, 1, displayWallets);

  const editedMsg = await bot.editMessageReplyMarkup(
    { inline_keyboard },
    { chat_id: msg.chat.id, message_id: msg.message_id }
  );

  const menu = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_SAVED_CATEGORY_TOKENS)
  );
  menu.message_options.reply_markup.inline_keyboard =
    editedMsg.reply_markup.inline_keyboard;

  const message = menu.message;
  const message_options = menu.message_options;
  await redis.SET(
    msg.chat.id + COINGECKO_SAVED_CATEGORY_TOKENS,
    JSON.stringify({
      message,
      message_options,
    })
  );
};
