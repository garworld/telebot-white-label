const { coingecko } = require("../constants");

const updateCategoryMessageMenu = async (
  updateKey,
  updateValue,
  bot,
  redis,
  msg,
  callback_data
) => {
  // console.log("MASUK SINI GA SIH?");

  // delete current reply
  bot.deleteMessage(msg.chat.id, msg.message_id);

  // delete old menu and update here
  // retrieved old menu info
  const menuMessageId = await redis.GET(
    msg.chat.id + coingecko.COINGECKO_MENU_MESSAGE_ID
  );
  const menu = JSON.parse(
    await redis.GET(msg.chat.id + coingecko.COINGECKO_SAVED_CATEGORY_TOKENS)
  );

  const inline_keyboard = menu.message_options.reply_markup.inline_keyboard;

  const amountIndex = inline_keyboard.findIndex((x) =>
    x[0].text.includes(updateKey)
  );

  const chainused = Number(await redis.GET(msg.chat_id + CHAIN_USED)) || 0;

  // update data from old menu
  inline_keyboard[amountIndex] = [
    {
      text: `${updateKey} ${updateValue}`,
      callback_data: callback_data,
    },
  ];
  menu.message_options.reply_markup.inline_keyboard = inline_keyboard;

  // delete old menu message
  bot.deleteMessage(msg.chat.id, menuMessageId);

  // send updated menu message and update menu info state on redis
  // const newMenu = await bot.sendMessage(msg.chat.id, menu.message, menu.message_options)
  const message_options = {
    inline_keyboard,
  };
  bot.editMessageReplyMarkup(message_options, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  });

  await redis.SET(
    msg.chat.id + coingecko.COINGECKO_MENU_MESSAGE_ID,
    newMenu.message_id
  );
  await redis.SET(
    msg.chat.id + coingecko.COINGECKO_SAVED_CATEGORY_TOKENS,
    JSON.stringify({
      message: menu.message,
      message_options: {
        ...menu.message_options,
        reply_markup: newMenu.reply_markup,
      },
    })
  );
};

module.exports = {
  updateCategoryMessageMenu,
};
