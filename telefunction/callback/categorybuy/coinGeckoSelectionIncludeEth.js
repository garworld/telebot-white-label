const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_OPTIONS_ID,
  LAST_CHAT,
  PRIVATE_TXN,
} = require("../../../constants/buytoken");
const {
  COINGECKO_CATEGORY_NAME,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
  COINGECKO_SELECTION_ETH_INCLUDES,
  COINGECKO_SELECTION_ETH_1,
  COINGECKO_SELECTION_ETH_2,
  COINGECKO_SELECTION_ETH_3,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  COINGECKO_ENTER_TOKEN_ADDRESS,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, msg, action, redis }) => {
  //
  const categoryCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
  );
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;
  let nativeToken;
  let amountText;
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      amountText = ["1", "10", "100"];
      break;
    case 3:
      nativeToken = "METIS";
      amountText = ["1", "10", "100"];
      break;
    case 4:
      nativeToken = "SOL";
      amountText = ["1", "10", "100"];
      break;
    default:
      nativeToken = "ETH";
      amountText = ["0.1", "0.5", "1.0"];
  }

  let amountSelect1 = `${amountText[0]} ${nativeToken}`;
  let amountSelect2 = `${amountText[1]} ${nativeToken}`;
  let amountSelect3 = `${amountText[2]} ${nativeToken}`;

  if (msg.reply_markup.inline_keyboard[4][1].text.includes("\u2705")) {
    amountSelect1 = "100 USDT";
    amountSelect2 = "500 USDT";
    amountSelect3 = "1000 USDT";
  }
  if (msg.reply_markup.inline_keyboard[4][2].text.includes("\u2705")) {
    amountSelect1 = "100 USDC";
    amountSelect2 = "500 USDC";
    amountSelect3 = "1000 USDC";
  }

  const categoryNameCheck = categoryCheck?.split("/")[0];
  const categoryChainCheck = categoryCheck?.split("/")[1];
  let categoryName = categoryNameCheck;

  let inline_keyboard = [
    [
      {
        text: "\u2261 Menu",
        callback_data: MENU_KEYBOARD_CALLBACK_DATA,
      },
    ],
    [
      {
        text: "======== Select Wallets =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[2][0].text,
        callback_data: COINGECKO_SELECTION_WALLET_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[2][1].text,
        callback_data: COINGECKO_SELECTION_WALLET_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[2][2].text,
        callback_data: COINGECKO_SELECTION_WALLET_3,
      },
    ],
    [
      {
        text: "======== Buy With ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[4][0].text,
        callback_data: CATEGORY_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[4][1].text,
        callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
      },
      {
        text: msg.reply_markup.inline_keyboard[4][2].text,
        callback_data: CATEGORY_SELECT_USDC,
      },
    ],
    [
      {
        text: "======= Select Amount =======",
        callback_data: "none",
      },
    ],
    [
      {
        text:
          action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
          "1"
            ? `${amountSelect1} \u2705`
            : `${amountSelect1}`,
        callback_data: COINGECKO_SELECTION_ETH_1,
      },
      {
        text:
          action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
          "2"
            ? `${amountSelect2} \u2705`
            : `${amountSelect2}`,
        callback_data: COINGECKO_SELECTION_ETH_2,
      },
      {
        text:
          action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
          "3"
            ? `${amountSelect3} \u2705`
            : `${amountSelect3}`,
        callback_data: COINGECKO_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: "\u270F Custom Amount",
        callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
      },
    ],
    [
      {
        text: "======= Set Slippage =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[9][0].text,
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[9][1].text,
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[9][2].text,
        callback_data: SLIPPAGE_CUSTOM_AMOUNT,
      },
    ],
    [
      {
        text: "======= Select Category =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: `\u270F ${categoryName} \u2705`,
        callback_data: COINGECKO_SELECT_CATEGORY_CALLBACK,
      },
    ],
    [
      {
        text: "======== Swap Summary =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2",
        callback_data: COINGECKO_ENTER_TOKEN_ADDRESS,
      },
    ],
  ];

  if (chainused == 0) {
    inline_keyboard = [
      [
        {
          text: "\u2261 Menu",
          callback_data: MENU_KEYBOARD_CALLBACK_DATA,
        },
      ],
      [
        {
          text: "======== Select Wallets =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[2][0].text,
          callback_data: COINGECKO_SELECTION_WALLET_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[2][1].text,
          callback_data: COINGECKO_SELECTION_WALLET_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[2][2].text,
          callback_data: COINGECKO_SELECTION_WALLET_3,
        },
      ],
      [
        {
          text: "======== Buy With ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[4][0].text,
          callback_data: CATEGORY_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[4][1].text,
          callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
        },
        {
          text: msg.reply_markup.inline_keyboard[4][2].text,
          callback_data: CATEGORY_SELECT_USDC,
        },
      ],
      [
        {
          text: "======= Select Amount =======",
          callback_data: "none",
        },
      ],
      [
        {
          text:
            action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
            "1"
              ? `${amountSelect1} \u2705`
              : `${amountSelect1}`,
          callback_data: COINGECKO_SELECTION_ETH_1,
        },
        {
          text:
            action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
            "2"
              ? `${amountSelect2} \u2705`
              : `${amountSelect2}`,
          callback_data: COINGECKO_SELECTION_ETH_2,
        },
        {
          text:
            action.split(":")[0].split(COINGECKO_SELECTION_ETH_INCLUDES)[1] ===
            "3"
              ? `${amountSelect3} \u2705`
              : `${amountSelect3}`,
          callback_data: COINGECKO_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: "\u270F Custom Amount",
          callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
        },
      ],
      [
        {
          text: "======= Set Slippage =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[9][0].text,
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[9][1].text,
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[9][2].text,
          callback_data: SLIPPAGE_CUSTOM_AMOUNT,
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[10][0].text,
          callback_data: PRIVATE_TXN + "category",
        },
      ],
      [
        {
          text: "======= Select Category =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: `\u270F ${categoryName} \u2705`,
          callback_data: COINGECKO_SELECT_CATEGORY_CALLBACK,
        },
      ],
      [
        {
          text: "======== Swap Summary =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2",
          callback_data: COINGECKO_ENTER_TOKEN_ADDRESS,
        },
      ],
    ];
  }
  const message_options = {
    inline_keyboard,
  };
  bot.editMessageReplyMarkup(
    message_options,

    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );

  // setup last chat for back option in future screens

  await redis.SET(
    msg.chat.id + LAST_CHAT,
    JSON.stringify({
      message: "test",
      message_options: { reply_markup: message_options },
    })
  );
};
