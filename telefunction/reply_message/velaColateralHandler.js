const {
  VELA_ORDER_COLLATERAL_MESSAGE_ID,
  VELA_COLLATERAL_PROMPT_MESSAGE,
  VELA_ORDER_COLLATERAL_ID,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the collateral amount the user inputted
  const collateralAmount = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + VELA_ORDER_COLLATERAL_MESSAGE_ID)
  );
  bot.deleteMessage(msg.chat.id, Number(messageId));

  // if the collateral amount is not a number and it's less than 20
  if (isNaN(Number(collateralAmount)) || Number(collateralAmount) < 20) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid collateral amount.\n";
    message += "Collateral must be a number greater than 20\n";
    message += VELA_COLLATERAL_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_ORDER_COLLATERAL_MESSAGE_ID,
      thisMessage.message_id
    );

    // if user provided valid collateral amount
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_ORDER_COLLATERAL_ID, collateralAmount);
  }
};
