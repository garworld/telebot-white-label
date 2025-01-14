const {
  COINGECKO_UPDATE_SLIPPAGE,
  COINGECKO_SLIPPAGE_PROMPT_MESSAGE,
  COINGECKO_SLIPPAGE,
  COINGECKO_CATEGORY_UPDATE_SLIPPAGE,
} = require("../../constants/coingecko");
const { coingecko } = require("../../helpers");

module.exports = async ({ bot, redis, msg }) => {
  // get the amount user wants to use for slippage
  const slippage = msg.text.trim();

  // delete the old message
  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_UPDATE_SLIPPAGE)
  );

  bot.deleteMessage(msg.chat.id, Number(messageId));

  // guard for non number amount
  if (isNaN(Number(slippage))) {
    // prompt the user again along with an error message
    let message = "ERROR: Invalid input to buy category of tokens.\n";
    message += "Slippage must be a number greater than 0.\n";
    message += COINGECKO_SLIPPAGE_PROMPT_MESSAGE;

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + COINGECKO_UPDATE_SLIPPAGE,
      thisMessage.message_id
    );

    return;
  }

  // update slippage state
  await redis.SET(msg.chat.id + COINGECKO_SLIPPAGE, slippage);

  // update menu with selected option
  await coingecko.updateCategoryMessageMenu(
    `slippage:`,
    slippage + "%",
    bot,
    redis,
    msg,
    COINGECKO_CATEGORY_UPDATE_SLIPPAGE
  );
};
