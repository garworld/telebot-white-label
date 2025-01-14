const {
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_TXN,
} = require("../../constants/buytoken");
const {
  SELL_SELECT_NATIVE,
  SELL_SELECT_USDT,
  SELL_SELECT_USDC,
  SELL_PERCENT_SELECT_1,
  SELL_PERCENT_SELECT_2,
  SELL_PERCENT_SELECT_3,
  SELL_PERCENT_SELECT_4,
  SELL_PERCENT_SELECT_5,
  SELL_PERCENT_SELECT_6,
  SELL_PERCENT_CUSTOM_AMOUNT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  SELL_SELECT_TOKENS,
} = require("../../constants/selltoken");

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
  //
  let tokenUsed = nativeToken;
  if (action.split(":")[1] === "usdt") {
    tokenUsed = "USDT";
  }
  if (action.split(":")[1] === "usdc") {
    tokenUsed = "USDC";
  }

  // console.log(action.split(":")[1]);

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
        text:
          action.split(":")[1] === "native"
            ? `${nativeToken} \u2705`
            : `${nativeToken}`,
        callback_data: SELL_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? "USDT \u2705" : "USDT"),
        callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
      },
      {
        text: action.split(":")[1] === "usdc" ? "USDC \u2705" : "USDC",
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
        text: msg.reply_markup.inline_keyboard[4][0].text,
        callback_data: SELL_PERCENT_SELECT_1,
      },
      {
        text: msg.reply_markup.inline_keyboard[4][1].text,
        callback_data: SELL_PERCENT_SELECT_2,
      },
      {
        text: msg.reply_markup.inline_keyboard[4][2].text,
        callback_data: SELL_PERCENT_SELECT_3,
      },
    ],
    [
      {
        text: msg.reply_markup.inline_keyboard[5][0].text,
        callback_data: SELL_PERCENT_SELECT_4,
      },
      {
        text: msg.reply_markup.inline_keyboard[5][1].text,
        callback_data: SELL_PERCENT_SELECT_5,
      },
      {
        text: msg.reply_markup.inline_keyboard[5][2].text,
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
          text:
            action.split(":")[1] === "native"
              ? `${nativeToken} \u2705`
              : `${nativeToken}`,
          callback_data: SELL_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? "USDT \u2705" : "USDT"),
          callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
        },
        {
          text: action.split(":")[1] === "usdc" ? "USDC \u2705" : "USDC",
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
          text: msg.reply_markup.inline_keyboard[4][0].text,
          callback_data: SELL_PERCENT_SELECT_1,
        },
        {
          text: msg.reply_markup.inline_keyboard[4][1].text,
          callback_data: SELL_PERCENT_SELECT_2,
        },
        {
          text: msg.reply_markup.inline_keyboard[4][2].text,
          callback_data: SELL_PERCENT_SELECT_3,
        },
      ],
      [
        {
          text: msg.reply_markup.inline_keyboard[5][0].text,
          callback_data: SELL_PERCENT_SELECT_4,
        },
        {
          text: msg.reply_markup.inline_keyboard[5][1].text,
          callback_data: SELL_PERCENT_SELECT_5,
        },
        {
          text: msg.reply_markup.inline_keyboard[5][2].text,
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
