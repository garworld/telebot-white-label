const {
  BUY_MESSAGE_MENU,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../constants/buytoken");
const logger = require("./logger");
// const redis = require("./redis");

const tokenErrorHandler = async (message, bot, msg, redis) => {
  try {
    let errorMessage;

    switch (true) {
      case message.includes("No pools"):
        errorMessage =
          "\uD83D\uDD34 <strong>Error</strong>: No pools available for swap!";
        break;
      case message.includes("Invalid address"):
        errorMessage =
          "\uD83D\uDD34 <strong>Error</strong>: Token contract address not found!\n----------------------------\nPlease make sure you enter the correct address.";
        break;
      case message.includes("gas required") || message.includes("maxFeePerGas"):
        errorMessage =
          "\uD83D\uDD34 <strong>Error</strong>: Insufficient funds.\n----------------------------\nPlease deposit sufficient funds into your wallet.";
        break;
      default:
        errorMessage =
          "\uD83D\uDD34 <strong>Error</strong>: An unexpected error occurred.";
    }

    // remove buy menu
    const messageBuyMenu = await redis.GET(msg.chat.id + BUY_MESSAGE_MENU);
    messageBuyMenu ? await redis.DEL(msg.chat.id + BUY_MESSAGE_MENU) : null;
    const sellPendingMsg = await redis.GET(msg.chat.id + "_sellPendingMsg");
    sellPendingMsg ? await redis.DEL(msg.chat.id + "_sellPendingMsg") : null;

    //
    messageBuyMenu ? bot.deleteMessage(msg.chat.id, Number(messageBuyMenu)) : null;
    if (sellPendingMsg) {
      bot.deleteMessage(msg.chat.id, Number(sellPendingMsg));
    }
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "HTML",
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

    return errorMessage;
  } catch (err) {
    logger.error("TOKEN ERROR HANDLER ERROR: " + err.message);

    return err;
  }
};

module.exports = { tokenErrorHandler };
