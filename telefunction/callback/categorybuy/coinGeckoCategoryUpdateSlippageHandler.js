const {
  COINGECKO_SLIPPAGE_PROMPT_MESSAGE,
  COINGECKO_UPDATE_SLIPPAGE,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, redis, msg }) => {
  const message = COINGECKO_SLIPPAGE_PROMPT_MESSAGE;

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
};
