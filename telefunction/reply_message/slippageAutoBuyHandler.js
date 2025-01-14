const { wallet_number } = require("@prisma/client");

const { autoBuyPage } = require("../modes");
const { AUTOBUY_SLIPPAGE_OPTIONS_ID, AUTOBUY_SETTINGS } = require("../../constants/autobuy");
const { autoBuyMessage } = require("../messages");
const { CHAIN_USED } = require("../../constants/buytoken");

module.exports = async ({ bot, redis, msg }) => {
  //
  const chainused = Number(await redis.GET(msg.chat_id + CHAIN_USED)) || 0;

  //
  const autoBuyOptions = await redis.GET(msg.chat.id + AUTOBUY_SLIPPAGE_OPTIONS_ID);
  const autoBuyHandler = await redis.GET(msg.chat.id + "_autobuyslippagemsg");

  autoBuyOptions ? await redis.DEL(msg.chat.id + AUTOBUY_SLIPPAGE_OPTIONS_ID) : null;
  autoBuyHandler ? await redis.DEL(msg.chat.id + "_autobuyslippagemsg") : null;

  if (isNaN(Number(msg.text))) {
    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    autoBuyHandler ? bot.deleteMessage(msg.chat.id, autoBuyHandler) : null;

    bot.editMessageText("Wrong Slippage Input", {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: msg.chat.id,
      message_id: autoBuyOptions,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: "!menu",
            },
          ],
          [
            {
              text: "======= Settings Navigator =======",
              callback_data: "none",
            },
          ],
          [
            {
              text: "Reset Settings",
              callback_data: "!autobuysettings",
            },
          ],
        ]
      },
    });
  } else {
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

      if (msg.text[0] === ".") {
        autoBuyProperties.slippage = Number("0" + msg.text);
      } else {
        autoBuyProperties.slippage = Number(msg.text);
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
    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    autoBuyHandler ? bot.deleteMessage(msg.chat.id, autoBuyHandler) : null;
    bot.editMessageText(message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: msg.chat.id,
      message_id: autoBuyOptions,
      reply_markup: {
        inline_keyboard: defaultInlineKey,
      }
    });
  }
};
