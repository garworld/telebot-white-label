const {
  COINGECKO_AMOUNT_PROMPT_MESSAGE,
  COINGECKO_UPDATE_AMOUNT,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, redis, msg }) => {
  const message = COINGECKO_AMOUNT_PROMPT_MESSAGE;

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
};
