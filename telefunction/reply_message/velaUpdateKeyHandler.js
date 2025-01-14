const { MENU_KEYBOARD_CALLBACK_DATA } = require("../../constants/buytoken");

module.exports = async ({
  bot,
  redis,
  msg,
  logger,
  saveVelaApiKey,
  timeouting,
}) => {
  clearTimeout(timeouting);

  const messageToDelete = await redis.GET(msg.chat.id + "_actionApiKey");
  await redis.DEL(msg.chat.id + "_actionApiKey");

  try {
    const apiData = msg.text.split(",");
    let newApiKey = apiData[0];
    let newApiId = apiData[1];

    const updatedApiKey = await saveVelaApiKey(
      msg.chat.id,
      newApiKey,
      newApiId
    );

    //
    if (updatedApiKey) {
      // the message to return
      let message = "\uD83D\uDFE2 <strong>Success</strong>\n\n";
      message += `API Key has been successfully replaced!`;

      //
      bot.deleteMessage(msg.chat.id, Number(messageToDelete));
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      });
    } else {
      // the message to return
      let message =
        "\uD83D\uDD34 <strong>Error:</strong> Private Key invalid.\n\n";
      message += "Please make sure you enter the correct Private Key.";

      //
      bot.deleteMessage(msg.chat.id, Number(messageToDelete));
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      });
    }
  } catch (errror) {
    logger.error("UPDATE API KEY ERROR: " + errror.message);

    // the message to return
    let message = "\uD83D\uDD34 <strong>Error:</strong> API Key invalid.\n\n";
    message += "Please make sure you enter the correct API Key.";

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
          ],
        ],
      },
    });
  }
};
