const { wallet_number } = require("@prisma/client");

const { MENU_KEYBOARD_CALLBACK_DATA, WALLET_CALLBACKDATA } = require("../../../constants/buytoken");
const { upsertAutoBuy } = require("../../../databases");
const { AUTOBUY_SETTINGS } = require("../../../constants/autobuy");

module.exports = async ({ bot, msg, redis }) => {
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

  if (theAutoBuy) {
    autoBuyProperties = JSON.parse(theAutoBuy);
    // console.log("CACHE: ", autoBuyProperties);

    await upsertAutoBuy(msg.chat.id, autoBuyProperties);
  }

  //
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  const autoBuySettings = await redis.GET(msg.chat.id + AUTOBUY_SETTINGS);
  if (autoBuySettings) {
    await redis.DEL(msg.chat.id + AUTOBUY_SETTINGS);
  }

  //
  const message = "<strong>Which setting would you like to access?</strong>";

  //
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
        [
          {
            text: "======= Wallet Settings =======",
            callback_data: "none",
          },
        ],
        [
          {
            text: "Wallet-1",
            callback_data: `${WALLET_CALLBACKDATA}:1`,
          },
          {
            text: "Wallet-2",
            callback_data: `${WALLET_CALLBACKDATA}:2`,
          },
          {
            text: "Wallet-3",
            callback_data: `${WALLET_CALLBACKDATA}:3`,
          },
        ],
        [
          {
            text: "======= Perpetuals =======",
            callback_data: "none",
          },
        ],
        [
          {
            text: "Perpetual API Key Settings",
            callback_data: "!apiKey",
          },
        ],
        [
          {
            text: "======= Bobby Buy Bot =======",
            callback_data: "none",
          },
        ],
        [
          {
            text: "Bobby Buy Bot Settings",
            callback_data: "!autobuysettings",
          },
        ],
      ],
    },
  });
};
