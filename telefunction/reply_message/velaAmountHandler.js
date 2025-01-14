const {
  VELA_ORDER_AMOUNT_MESSAGE_ID,
  VELA_AMOUNT_PROMPT_MESSAGE,
  VELA_ORDER_COLLATERAL_ID,
  VELA_ORDER_AMOUNT,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  // get the user inputted amount
  const amount = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + VELA_ORDER_AMOUNT_MESSAGE_ID)
  );
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(amount)) || Number(amount) < 0) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid amount\n";
    message += "Amount should be a number greater than 0\n";
    message += VELA_AMOUNT_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_ORDER_AMOUNT_MESSAGE_ID,
      thisMessage.message_id
    );
    // if user provided valid amount
  } else {
    // fetch collateral to compare, if it's already been inputted
    let collateral = JSON.parse(
      await redis.GET(msg.chat.id + VELA_ORDER_COLLATERAL_ID)
    );

    // // if collateral has been set AND if collateral is less than amount
    // if ((collateral != null && !isNaN(Number(collateral))) && collateral >= Number(amount)) {
    //   // prompt the user again along with an error message
    //   let message = "ERROR: Invalid amount\n"
    //   message += "Amount should be a number greater than collateral\n"
    //   message += VELA_AMOUNT_PROMPT_MESSAGE;

    //   const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    //     parse_mode: "HTML",
    //     disable_web_page_preview: true,
    //     reply_markup: {
    //       force_reply: true,
    //     },
    //   });

    //   await redis.SET(
    //     msg.chat.id + VELA_ORDER_AMOUNT_MESSAGE_ID,
    //     thisMessage.message_id
    //   );
    // } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_ORDER_AMOUNT, amount);
    // }
  }
};
