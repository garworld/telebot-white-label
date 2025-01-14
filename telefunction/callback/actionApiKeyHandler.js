const {
  BACK_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
} = require("../../constants/buytoken");

module.exports = async ({ bot, action, redis, chains, msg }) => {
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  switch (action.split(":")[1]) {
    case "updateApiKey":
      message = `<strong>Update Vela API Key And ID</strong>\nBy updating the vela API key and ID, you will replace the current API key and id for <em>Vela</em>.\n`;
      message += `----------------------------\n<strong>Enter the API Key and Id</strong> for vela exchange. Example below\n`;
      message += "Example: &lt;API KEY HERE&gt;,&lt;API ID HERE&gt;\n";
      message += "replace &lt;API KEY HERE&gt; with your API key for vela";
      message += "replace &lt;API ID HERE&gt; with your API id for vela";

      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          force_reply: true,
        },
      };

      bot.deleteMessage(msg.chat.id, msg.message_id);

      break;
    default:
      //
      message = `<a href="${chains[chainused].chain_scanner}/address/${wallet.address}">Wallet-${walletNumber}</a>\n`;

      //
      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      };

      bot.deleteMessage(msg.chat.id, msg.message_id);
      break;
  }

  //
  const sentMsg = await bot.sendMessage(msg.chat.id, message, msgOptions);

  //
  await redis.SET(msg.chat.id + "_actionApiKey", sentMsg.message_id);
};
