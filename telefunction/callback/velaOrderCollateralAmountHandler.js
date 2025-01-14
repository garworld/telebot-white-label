const {
  VELA_COLLATERAL_PROMPT_MESSAGE,
  VELA_ORDER_COLLATERAL_MESSAGE_ID,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg }) => {
  const message = VELA_COLLATERAL_PROMPT_MESSAGE;

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
};
