const {
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  SLIPPAGE_SELECT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  DEFAULT_SLIPPAGE_AMOUNT,
  PRIVATE_TXN,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
  BUY_OPTIONS_ID,
} = require("../../constants/buytoken");

module.exports = async ({ bot, redis, msg, action }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

  // console.log("SLIPPAGE WAS HERE");
  const selectedSlippage = action.split(":")[0].split(SLIPPAGE_SELECT)[1];

  let inline_keyboard = [
    [
      {
        // text: Buffer.concat([Buffer.from("\xF0\x9F\x94\xA7"), Buffer.from(" SETTINGS")]).toString("utf-8"),
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
        callback_data: BUY_SELECTION_WALLET_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[2][1].text,
        callback_data: BUY_SELECTION_WALLET_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[2][2].text,
        callback_data: BUY_SELECTION_WALLET_3,
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
        callback_data: BUY_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[4][1].text,
        callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
      },
      {
        text: msg.reply_markup.inline_keyboard[4][2].text,
        callback_data: BUY_SELECT_USDC,
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
        callback_data: BUY_SELECTION_ETH_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[6][1].text,
        callback_data: BUY_SELECTION_ETH_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[6][2].text,
        callback_data: BUY_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[7][0].text,
        callback_data: BUY_CUSTOM_AMOUNT_ETH,
      },
    ],
    [
      {
        text: "======== Select Slippage ========",
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
        text: "======== Swap Summary =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[11][0].text,
        callback_data: msg.reply_markup.inline_keyboard[11][0].callback_data,
      },
    ],
  ];

  if (chainused === 0) {
    inline_keyboard = [
      [
        {
          // text: Buffer.concat([Buffer.from("\xF0\x9F\x94\xA7"), Buffer.from(" SETTINGS")]).toString("utf-8"),
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
          callback_data: BUY_SELECTION_WALLET_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[2][1].text,
          callback_data: BUY_SELECTION_WALLET_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[2][2].text,
          callback_data: BUY_SELECTION_WALLET_3,
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
          callback_data: BUY_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[4][1].text,
          callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
        },
        {
          text: msg.reply_markup.inline_keyboard[4][2].text,
          callback_data: BUY_SELECT_USDC,
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
          callback_data: BUY_SELECTION_ETH_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[6][1].text,
          callback_data: BUY_SELECTION_ETH_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[6][2].text,
          callback_data: BUY_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[7][0].text,
          callback_data: BUY_CUSTOM_AMOUNT_ETH,
        },
      ],
      [
        {
          text: "======== Select Slippage ========",
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
          text: msg.reply_markup.inline_keyboard[10][0]?.text,
          callback_data: PRIVATE_TXN + "buy",
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
          text: msg.reply_markup.inline_keyboard[12][0].text,
          callback_data: msg.reply_markup.inline_keyboard[12][0].callback_data,
        },
      ],
    ];
  }

  await redis.SET(
    msg.chat.id + BUY_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard
      },
    })
  );

  //
  bot.editMessageReplyMarkup(
    {
      inline_keyboard,
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
