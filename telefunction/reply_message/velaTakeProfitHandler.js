const {
  VELA_PROFIT_VALUE_MESSAGE_ID,
  VELA_TAKE_PROFIT_VALUE,
  VELA_TAKE_PROFIT_PROMPT_MESSAGE,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the user inputted take profit value
  const takeProfitValue = msg.text.trim();

  // delete the old message
  let messageId = await redis.GET(msg.chat.id + VELA_PROFIT_VALUE_MESSAGE_ID);
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(takeProfitValue)) || Number(takeProfitValue) <= 0) {
    let message = "ERROR: Invalid take profit\n";
    message += "Take Profit must be a number greater than 0\n";
    message += VELA_TAKE_PROFIT_PROMPT_MESSAGE;
    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_PROFIT_VALUE_MESSAGE_ID,
      thisMessage.message_id
    );
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_TAKE_PROFIT_VALUE, takeProfitValue);
  }
};
