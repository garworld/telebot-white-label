module.exports = (bot, msg) => {
  // the message to return
  const message = "\uD83D\uDD34 Error: Please try again later.";

  //
  bot.sendMessage(msg.chat.id, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u2261 Menu",
            callback_data: "!menu",
          },
        ],
      ],
    },
  });
};
