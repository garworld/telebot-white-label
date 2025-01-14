const {
  BUY_SELECT_TOKEN,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  BUY_ENTER_TOKEN_ADDRESS,
  PRIVATE_TXN,
  BUY_OPTIONS_ID,
} = require("../../constants/buytoken");

module.exports = async ({ bot, redis, msg, action }) => {
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
        text:
          action.split(":")[1] === "native"
            ? `${nativeToken} \u2705`
            : `${nativeToken}`,
        callback_data: BUY_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? "USDT \u2705" : "USDT"),
        callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
      },
      {
        text: action.split(":")[1] === "usdc" ? "USDC \u2705" : "USDC",
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

  if (chainused == 0) {
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
          text:
            action.split(":")[1] === "native"
              ? `${nativeToken} \u2705`
              : `${nativeToken}`,
          callback_data: BUY_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? `USDT \u2705` : `USDT`),
          callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
        },
        {
          text: action.split(":")[1] === "usdc" ? `USDC \u2705` : `USDC`,
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

  const updateButtonAmount = (existText, newText) => {
    const checkedEmoji = "\u2705";
    return existText.includes(checkedEmoji)
      ? newText + " " + checkedEmoji
      : newText;
  };

  switch (action.split(":")[1]) {
    case "native":
      inline_keyboard[6][0].text = updateButtonAmount(
        inline_keyboard[6][0].text,
        `${amountText[0]} ${nativeToken}`
      );
      inline_keyboard[6][1].text = updateButtonAmount(
        inline_keyboard[6][1].text,
        `${amountText[1]} ${nativeToken}`
      );
      inline_keyboard[6][2].text = updateButtonAmount(
        inline_keyboard[6][2].text,
        `${amountText[2]} ${nativeToken}`
      );
      break;
    case "usdt":
      inline_keyboard[6][0].text = updateButtonAmount(
        inline_keyboard[6][0].text,
        "100 USDT"
      );
      inline_keyboard[6][1].text = updateButtonAmount(
        inline_keyboard[6][1].text,
        "500 USDT"
      );
      inline_keyboard[6][2].text = updateButtonAmount(
        inline_keyboard[6][2].text,
        "1000 USDT"
      );
      break;
    case "usdc":
      inline_keyboard[6][0].text = updateButtonAmount(
        inline_keyboard[6][0].text,
        "100 USDC"
      );
      inline_keyboard[6][1].text = updateButtonAmount(
        inline_keyboard[6][1].text,
        "500 USDC"
      );
      inline_keyboard[6][2].text = updateButtonAmount(
        inline_keyboard[6][2].text,
        "1000 USDC"
      );
      break;
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
