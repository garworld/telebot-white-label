const { BUY_OPTIONS_ID, CHAIN_USED } = require("../../../constants/buytoken");

module.exports = async ({ bot, redis, msg }) => {
  //
  await redis.SET(
    msg.chat.id + BUY_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );

  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      break;
    case 4:
      nativeToken = "SOL";
      break;
    default:
      nativeToken = "ETH";
  }

  //
  let tokenUsed = nativeToken;
  if (msg.reply_markup.inline_keyboard[4][1].text.includes("\u2705")) {
    tokenUsed = "USDT";
  }
  if (msg.reply_markup.inline_keyboard[4][2].text.includes("\u2705")) {
    tokenUsed = "USDC";
  }

  //
  const message = `Please insert <strong>${tokenUsed} Amount</strong> to be spent. This amount will be split equally into the tokens within the selected category. \n(Example:0.75)`;

  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_ethcustom", thisMessage.message_id);
};
