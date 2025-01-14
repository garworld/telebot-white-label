const {
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECTION_ETH_INCLUDES,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  PRIVATE_TXN,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
  BUY_OPTIONS_ID,
} = require("../../constants/buytoken");

module.exports = async ({ bot, redis, msg, action }) => {
  // //
  // const currentInlineKeyboard = msg.reply_markup.inline_keyboard;
  // console.log({ currentInlineKeyboard });

  //
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
        text:
          action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "1"
            ? `${amountSelect1} \u2705`
            : `${amountSelect1}`,
        callback_data: BUY_SELECTION_ETH_1,
      },
      {
        text:
          action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "2"
            ? `${amountSelect2} \u2705`
            : `${amountSelect2}`,
        callback_data: BUY_SELECTION_ETH_2,
      },
      {
        text:
          action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "3"
            ? `${amountSelect3} \u2705`
            : `${amountSelect3}`,
        callback_data: BUY_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: "\u270F Custom Amount",
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
          text:
            action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "1"
              ? `${amountSelect1} \u2705`
              : `${amountSelect1}`,
          callback_data: BUY_SELECTION_ETH_1,
        },
        {
          text:
            action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "2"
              ? `${amountSelect2} \u2705`
              : `${amountSelect2}`,
          callback_data: BUY_SELECTION_ETH_2,
        },
        {
          text:
            action.split(":")[0].split(BUY_SELECTION_ETH_INCLUDES)[1] === "3"
              ? `${amountSelect3} \u2705`
              : `${amountSelect3}`,
          callback_data: BUY_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: "\u270F Custom Amount",
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
