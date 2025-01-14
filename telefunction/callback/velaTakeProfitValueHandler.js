const {
  VELA_TAKE_PROFIT_PROMPT_MESSAGE,
  VELA_PROFIT_VALUE_MESSAGE_ID,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg }) => {
  const thisMessage = await bot.sendMessage(
    msg.chat.id,
    VELA_TAKE_PROFIT_PROMPT_MESSAGE,
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    }
  );

  await redis.SET(
    msg.chat.id + VELA_PROFIT_VALUE_MESSAGE_ID,
    thisMessage.message_id
  );
};
