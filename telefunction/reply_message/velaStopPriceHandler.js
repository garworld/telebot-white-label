const {
  VELA_STOP_PRICE_MESSAGE_ID,
  VELA_STOP_PRICE_PROMPT_MESSAGE,
  VELA_ORDER_STOP_PRICE,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the user inputted stop Price
  const stopPrice = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + VELA_STOP_PRICE_MESSAGE_ID)
  );
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(stopPrice)) || Number(stopPrice) < 0) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid Stop Price\n";
    message += "Stop price must be a number greater than 0\n";
    message += VELA_STOP_PRICE_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_STOP_PRICE_MESSAGE_ID,
      thisMessage.message_id
    );
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    set;
    await redis.SET(msg.chat.id + VELA_ORDER_STOP_PRICE, stopPrice);
  }
};
