const { AUTOBUY_SLIPPAGE_OPTIONS_ID } = require("../../../constants/autobuy");

module.exports = async ({ bot, msg, redis }) => {
  //
  await redis.SET(
    msg.chat.id + AUTOBUY_SLIPPAGE_OPTIONS_ID,
    msg.message_id
  );
  
  //
  const message = `Please insert Custom Slippage for auto buy.\n(Example: 5)`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_autobuyslippagemsg", thisMessage.message_id);
};