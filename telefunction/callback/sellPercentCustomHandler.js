const { SELL_OPTIONS_ID } = require("../../constants/selltoken");

module.exports = async ({ bot, redis, msg }) => {
  //
  await redis.SET(
    msg.chat.id + SELL_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );
  // sell_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  const message =
    "Please insert <strong>% of Bag</strong> to be sold.\n(Must be between 0 - 100)";

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_percentcustom", thisMessage.message_id);
};
