const { MENU_KEYBOARD_CALLBACK_DATA } = require("../../../constants/buytoken");
const {
  COINGECKO_CATEGORY_CALLBACK_DATA,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, msg }) => {
  const status = {
    pending:
      "\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.",
    success: "\uD83D\uDFE2 Success [Tx]",
    error: "\uD83D\uDD34 Error: Insufficient ETH for gas.",
  };
  let message = "";
  message += "[Wallet-1]\n\n";
  message += "0.1 ETH → 2.531 BNB\n";
  message += `${status.pending}\n\n`;
  message += "0.1 ETH → 2.531 BNB\n";
  message += `${status.success}\n\n`;
  message += "0.1 ETH → 2.531 BNB\n";
  message += `${status.error}\n\n`;
  message += "Share on Twitter";

  //
  bot.deleteMessage(msg.chat.id, msg.message_id);
  bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\uD83D\uDED2 Buy More",
            callback_data: COINGECKO_CATEGORY_CALLBACK_DATA,
          },
          {
            text: "\u2261 Menu",
            callback_data: MENU_KEYBOARD_CALLBACK_DATA,
          },
        ],
      ],
    },
  });
};
