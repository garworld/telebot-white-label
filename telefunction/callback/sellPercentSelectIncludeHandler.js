const {
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_TXN,
  CHAIN_USED,
} = require("../../constants/buytoken");
const {
  SELL_PERCENT_SELECT_INCLUDES,
  SELL_PERCENT_SELECT_1,
  SELL_PERCENT_SELECT_2,
  SELL_PERCENT_SELECT_3,
  SELL_PERCENT_SELECT_4,
  SELL_PERCENT_SELECT_5,
  SELL_PERCENT_SELECT_6,
  SELL_PERCENT_CUSTOM_AMOUNT,
  SELL_SELECT_TOKENS,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  SELL_SELECT_NATIVE,
  SELL_SELECT_USDT,
  SELL_SELECT_USDC,
} = require("../../constants/selltoken");

module.exports = async ({ bot, msg, action, redis }) => {
  // console.log("MSG PERCENT SELECT: ", msg)
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      break;
    case 4:
      nativeToken = "SOL";
      break;
    default:
      nativeToken = "ETH";
  }

  //
  let tokenUsed = nativeToken;
  if (msg.reply_markup.inline_keyboard[2][1].text.includes("\u2705")) {
    tokenUsed = "USDT";
  }
  if (msg.reply_markup.inline_keyboard[2][2].text.includes("\u2705")) {
    tokenUsed = "USDC";
  }

  //
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
        text: "======== Sell To ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[2][0].text,
        callback_data: SELL_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[2][1].text,
        callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
      },
      {
        text: msg.reply_markup.inline_keyboard[2][2].text,
        callback_data: SELL_SELECT_USDC,
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
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "1"
            ? "10% \u2705"
            : "10%",
        callback_data: SELL_PERCENT_SELECT_1,
      },
      {
        text:
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "2"
            ? "20% \u2705"
            : "20%",
        callback_data: SELL_PERCENT_SELECT_2,
      },
      {
        text:
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "3"
            ? "30% \u2705"
            : "30%",
        callback_data: SELL_PERCENT_SELECT_3,
      },
    ],
    [
      {
        text:
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "4"
            ? "50% \u2705"
            : "50%",
        callback_data: SELL_PERCENT_SELECT_4,
      },
      {
        text:
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "5"
            ? "75% \u2705"
            : "75%",
        callback_data: SELL_PERCENT_SELECT_5,
      },
      {
        text:
          action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "6"
            ? "100% \u2705"
            : "100%",
        callback_data: SELL_PERCENT_SELECT_6,
      },
    ],
    [
      {
        text: "\u270F Custom Amount",
        callback_data: SELL_PERCENT_CUSTOM_AMOUNT,
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
        text: msg.reply_markup.inline_keyboard[8][0].text,
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[8][1].text,
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[8][2].text,
        callback_data: SLIPPAGE_CUSTOM_AMOUNT,
      },
    ],
    [
      {
        text: `======== Swap to ${tokenUsed} =======`,
        callback_data: "none",
      },
    ],
    [
      {
        text: "\uD83D\uDCB8 Select Tokens & Send Sell Tx \uD83D\uDCB8",
        callback_data: SELL_SELECT_TOKENS,
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
          text: "======== Sell To ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[2][0].text,
          callback_data: SELL_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : msg.reply_markup.inline_keyboard[2][1].text,
          callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
        },
        {
          text: msg.reply_markup.inline_keyboard[2][2].text,
          callback_data: SELL_SELECT_USDC,
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
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "1"
              ? "10% \u2705"
              : "10%",
          callback_data: SELL_PERCENT_SELECT_1,
        },
        {
          text:
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "2"
              ? "20% \u2705"
              : "20%",
          callback_data: SELL_PERCENT_SELECT_2,
        },
        {
          text:
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "3"
              ? "30% \u2705"
              : "30%",
          callback_data: SELL_PERCENT_SELECT_3,
        },
      ],
      [
        {
          text:
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "4"
              ? "50% \u2705"
              : "50%",
          callback_data: SELL_PERCENT_SELECT_4,
        },
        {
          text:
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "5"
              ? "75% \u2705"
              : "75%",
          callback_data: SELL_PERCENT_SELECT_5,
        },
        {
          text:
            action.split(":")[0].split(SELL_PERCENT_SELECT_INCLUDES)[1] === "6"
              ? "100% \u2705"
              : "100%",
          callback_data: SELL_PERCENT_SELECT_6,
        },
      ],
      [
        {
          text: "\u270F Custom Amount",
          callback_data: SELL_PERCENT_CUSTOM_AMOUNT,
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
          text: msg.reply_markup.inline_keyboard[8][0].text,
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[8][1].text,
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[8][2].text,
          callback_data: SLIPPAGE_CUSTOM_AMOUNT,
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[9][0]?.text,
          callback_data: PRIVATE_TXN + "sell",
        },
      ],
      [
        {
          text: `======== Swap to ${tokenUsed} =======`,
          callback_data: "none",
        },
      ],
      [
        {
          text: "\uD83D\uDCB8 Select Tokens & Send Sell Tx \uD83D\uDCB8",
          callback_data: SELL_SELECT_TOKENS,
        },
      ],
    ];
  }
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
