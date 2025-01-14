const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_TXN,
} = require("../../../constants/buytoken");
const {
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
  COINGECKO_CATEGORY_NAME,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
  COINGECKO_SELECTION_ETH_1,
  COINGECKO_SELECTION_ETH_2,
  COINGECKO_SELECTION_ETH_3,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  COINGECKO_ENTER_TOKEN_ADDRESS,
} = require("../../../constants/coingecko");

module.exports = async ({ bot, msg, redis, action }) => {
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
        text:
          action.split(":")[1] === "native"
            ? `${nativeToken} \u2705`
            : `${nativeToken}`,
        callback_data: CATEGORY_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? "USDT \u2705" : "USDT"),
        callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
      },
      {
        text: action.split(":")[1] === "usdc" ? "USDC \u2705" : "USDC",
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
          text:
            action.split(":")[1] === "native"
              ? `${nativeToken} \u2705`
              : `${nativeToken}`,
          callback_data: CATEGORY_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : (action.split(":")[1] === "usdt" ? "USDT \u2705" : "USDT"),
          callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
        },
        {
          text: action.split(":")[1] === "usdc" ? "USDC \u2705" : "USDC",
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

  const message_options = {
    inline_keyboard,
  };
  bot.editMessageReplyMarkup(message_options, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  });
};
