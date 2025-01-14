const {
  BUY_OPTIONS_ID,
  BUY_TOKEN_ADDRESS,
} = require("../../constants/buytoken");

module.exports = async ({ bot, redis, msg }) => {
  //
  await redis.SET(
    msg.chat.id + BUY_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );
  // buy_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  const message =
    "Please insert <strong>ERC-20 Token Contract Address</strong>.\n(Example: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)";

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + BUY_TOKEN_ADDRESS, thisMessage.message_id);
};
