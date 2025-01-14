const { SNIPE_TOKEN_OPTIONS_ID } = require("../../../constants/sniping");
const { CHAIN_USED } = require("../../../constants/buytoken");

module.exports = async ({ bot, msg, redis }) => {
  //
  await redis.SET(
    msg.chat.id + SNIPE_TOKEN_OPTIONS_ID,
    msg.message_id
  );

  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      break;
    default:
      nativeToken = "ETH";
  }
  
  //
  const message = `Please insert Token Address to snipe.\n(Example: 0xdAC17F958D2ee523a2206206994597C13D831ec7)`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_snipetokenmsg", thisMessage.message_id);
};
