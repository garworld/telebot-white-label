const {
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
  LAST_CHAT,
  PRIVATE_TXN,
} = require("../../../constants/buytoken");
const {
  SLIPPAGE_SELECT,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
  COINGECKO_SELECTION_ETH_1,
  COINGECKO_SELECTION_ETH_2,
  COINGECKO_SELECTION_ETH_3,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  SLIPPAGE_SELECTION_1,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  COINGECKO_ENTER_TOKEN_ADDRESS,
  COINGECKO_CATEGORY_NAME,
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, msg, action, redis }) => {
  const selectedSlippage = action.split(SLIPPAGE_SELECT)[1];

  //get categoryName
  //
  const categoryCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
  );
  const categoryNameCheck = categoryCheck?.split("/")[0];
  let categoryName = categoryNameCheck;

  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

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
        text: msg.reply_markup.inline_keyboard[6][0].text,
        callback_data: COINGECKO_SELECTION_ETH_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[6][1].text,
        callback_data: COINGECKO_SELECTION_ETH_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[6][2].text,
        callback_data: COINGECKO_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[7][0].text,
        callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
      },
    ],
    [
      {
        text: "======== Set Slippage ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: selectedSlippage == 1 ? `1% \u2705` : `1%`,
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text:
          selectedSlippage == 2
            ? `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`
            : `${DEFAULT_SLIPPAGE_AMOUNT}`,
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text: "\u270F Custom",
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
          text: msg.reply_markup.inline_keyboard[6][0].text,
          callback_data: COINGECKO_SELECTION_ETH_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[6][1].text,
          callback_data: COINGECKO_SELECTION_ETH_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[6][2].text,
          callback_data: COINGECKO_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[7][0].text,
          callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
        },
      ],
      [
        {
          text: "======== Set Slippage ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: selectedSlippage == 1 ? `1% \u2705` : `1%`,
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text:
            selectedSlippage == 2
              ? `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`
              : `${DEFAULT_SLIPPAGE_AMOUNT}`,
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text: "\u270F Custom",
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
  bot.editMessageReplyMarkup(message_options, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  });

  // setup last chat for back option in future screens
  await redis.SET(
    msg.chat.id + LAST_CHAT,
    JSON.stringify({
      message: "test",
      message_options: { reply_markup: message_options },
    })
  );
};
