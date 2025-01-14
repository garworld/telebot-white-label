const {
  VELA_ASSET_MESSAGE_ID,
  VELA_ASSET_ID,
} = require("../../constants/vela");

module.exports = async ({ bot, redis, msg, setShowVelaOrderOptions }) => {
  const tokenId = msg.text.trim();

  let messageId = JSON.parse(
    await redis.GET(msg.chat.id + VELA_ASSET_MESSAGE_ID)
  );

  // delete old message
  bot.deleteMessage(msg.chat.id, Number(messageId));

  if (isNaN(Number(tokenId)) || Number(tokenId) < 0) {
    let message = "INVALID asset Id.\n";
    message += "Asset Id must be a number\n";
    message +=
      "Please enter the <strong>Vela Id</strong> of the asset. (Please check the <a href='https://docs.vela.exchange/vela-knowledge-base/developers/asset-pairs-and-velaid'>Vela list</a> for the list of Vela asset pairs";

    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    await redis.SET(
      msg.chat.id + VELA_ASSET_MESSAGE_ID,
      thisMessage.message_id
    );

    // if user provided a valid vela asset id
  } else {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
    await redis.SET(msg.chat.id + VELA_ASSET_ID, tokenId);
  }
};
