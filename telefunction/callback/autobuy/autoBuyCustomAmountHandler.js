const { AUTOBUY_AMOUNT_OPTIONS_ID } = require("../../../constants/autobuy");

module.exports = async ({ bot, msg, redis }) => {
  //
  await redis.SET(
    msg.chat.id + AUTOBUY_AMOUNT_OPTIONS_ID,
    msg.message_id
  );
  
  //
  const message = `Please insert Custom Amount for auto buy.\n(Example: 0.1)`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_autobuyamountmsg", thisMessage.message_id);
};
