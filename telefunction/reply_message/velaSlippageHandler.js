const {
  VELA_ORDER_SLIPPAGE_MESSAGE_ID,
  VELA_SLIPPAGE_PROMPT_MESSAGE,
  VELA_ORDER_SLIPPAGE,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the user inputted slippage
  const slippage = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + VELA_ORDER_SLIPPAGE_MESSAGE_ID)
  );
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(slippage)) || Number(slippage) <= 0) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid slippage\n";
    message += "Slippage must be a number greater than 0\n";
    message += VELA_SLIPPAGE_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_ORDER_SLIPPAGE_MESSAGE_ID,
      thisMessage.message_id
    );
    // if user provided valid slippage
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_ORDER_SLIPPAGE, slippage);
  }
};
