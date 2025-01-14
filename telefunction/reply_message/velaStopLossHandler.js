const {
  VELA_STOP_LOSS_MESSAGE_ID,
  VELA_STOP_LOSS_PROMPT_MESSAGE,
  VELA_STOP_LOSS_VALUE,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the user inputted stop loss value
  const stopLossValue = msg.text.trim();

  // delete the old message
  let messageId = await redis.GET(msg.chat.id + VELA_STOP_LOSS_MESSAGE_ID);
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(stopLossValue)) || Number(stopLossValue) < 0) {
    let message = "ERROR: Invalid stop loss\n";
    message += "Stop loss must be a positive number\n";
    message += VELA_STOP_LOSS_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_STOP_LOSS_MESSAGE_ID,
      thisMessage.message_id
    );
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_STOP_LOSS_VALUE, stopLossValue);
  }
};
