const {
  SLIPPAGE_OPTIONS,
  SLIPPAGE_PROMPT,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_CUSTOM,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, redis, msg }) => {
  await redis.SET(
    msg.chat.id + SLIPPAGE_OPTIONS,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );

  const message = `Please <strong> insert your ${SLIPPAGE_PROMPT} (in %)</strong> for the swap.\n<i>Setting the slippage increases the risk of being front-run.</i>\n<i>(Default: ${DEFAULT_SLIPPAGE_AMOUNT})</i>`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_review: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + SLIPPAGE_CUSTOM, thisMessage.message_id);
};
