const {
  COINGECKO_UPDATE_AMOUNT,
  COINGECKO_AMOUNT_PROMPT_MESSAGE,
  COINGECKO_AMOUNT,
  COINGECKO_CATEGORY_UPDATE_AMOUNT,
} = require("../../constants/coingecko");
const { coingecko } = require("../../helpers");

module.exports = async ({ bot, redis, msg }) => {
  // get the collateral amount the user inputted
  const buyAmount = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_UPDATE_AMOUNT)
  );

  bot.deleteMessage(msg.chat.id, Number(messageId));

  // guard for non number amount
  if (isNaN(Number(buyAmount))) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid input to buy category of tokens.\n";
    message += "Buy amount must be a number greater than 0.\n";
    message += COINGECKO_AMOUNT_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + COINGECKO_UPDATE_AMOUNT,
      thisMessage.message_id
    );

    return;
  }

  // update amount state
  await redis.SET(msg.chat.id + COINGECKO_AMOUNT, buyAmount);

  // update menu with selected option
  await coingecko.updateCategoryMessageMenu(
    `amount:`,
    buyAmount,
    bot,
    redis,
    msg,
    COINGECKO_CATEGORY_UPDATE_AMOUNT
  );
};
