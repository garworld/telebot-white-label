const { wallet_number } = require("@prisma/client");

const { autoBuyPage } = require("../../modes");
const { autoBuyMessage } = require("../../messages");
const { AUTOBUY_SETTINGS } = require("../../../constants/autobuy");
const { CHAIN_USED } = require("../../../constants/buytoken");

module.exports = async ({ bot, msg, redis, action }) => {
  //
  const chainused = Number(await redis.GET(msg.chat_id + CHAIN_USED)) || 0;

  //
  let autoBuyProperties = {
    walletUsed: [wallet_number.FIRST],
    amount: 20,
    unit: null,
    slippage: 10,
    isPrivate: false,
  };

  //
  const theAutoBuy = await redis.GET(msg.chat.id + AUTOBUY_SETTINGS);

  //
  if (theAutoBuy) {
    autoBuyProperties = JSON.parse(theAutoBuy);
    // console.log("CACHE: ", autoBuyProperties);

    switch (action.split(":")[1]) {
      case "usdt":
        autoBuyProperties.unit = "USDT";
        break;
      case "usdc":
        autoBuyProperties.unit = "USDC";
        break;
      default:
        autoBuyProperties.unit = null;
        break;
    }

    await redis.SET(
      msg.chat.id + AUTOBUY_SETTINGS,
      JSON.stringify(autoBuyProperties)
    );
  }

  //
  autoBuyProperties.chainused = chainused;

  // default inline keyboard
  const defaultInlineKey = autoBuyPage(autoBuyProperties);

  //
  const message = autoBuyMessage();

  //
  bot.editMessageText(message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: defaultInlineKey,
    }
  });
};
