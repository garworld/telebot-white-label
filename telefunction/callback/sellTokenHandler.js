const {
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_TXN,
  CHAIN_USED,
  PRIVATE_SELECT,
} = require("../../constants/buytoken");
const {
  SELL_PROCESS_ID,
  SELL_MESSAGE_ID,
  SELL_PERCENT_SELECT_1,
  SELL_PERCENT_SELECT_2,
  SELL_PERCENT_SELECT_3,
  SELL_PERCENT_SELECT_4,
  SELL_PERCENT_SELECT_5,
  SELL_PERCENT_SELECT_6,
  SELL_PERCENT_CUSTOM_AMOUNT,
  SELL_SELECT_TOKENS,
  SELL_MESSAGE_MENU,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  DEFAULT_SLIPPAGE_AMOUNT,
  SELL_SELECT_NATIVE,
  SELL_SELECT_USDT,
  SELL_SELECT_USDC,
} = require("../../constants/selltoken");
const balanceInfo = require("../balanceInfo");
const summary = require("../summary");

module.exports = async ({ bot, redis, msg }) => {
  // remove last message
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  const chainUsed = Number((await redis.GET(msg.chat.id + CHAIN_USED)) || 0);

  let nativeToken;
  switch (chainUsed) {
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
  (await redis.GET(msg.chat.id + SELL_PROCESS_ID))
    ? await redis.DEL(msg.chat.id + SELL_PROCESS_ID)
    : null;
  (await redis.GET(msg.chat.id + SELL_MESSAGE_ID))
    ? await redis.DEL(msg.chat.id + SELL_MESSAGE_ID)
    : null;

  //
  let message = await balanceInfo(msg, redis);
  message += "<i>Sell tokens easily with James Bot</i>\n";
  message += `<a href="https://docs.jamesbot.ai/sell-tokens"><i>Learn more</i></a>\n`;

  const isPrivateRedis = await redis.GET(msg.chat.id + PRIVATE_SELECT + "sell");

  const isPrivate = isPrivateRedis ? JSON.parse(isPrivateRedis) : false;

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
        text: `${nativeToken} \u2705`,
        callback_data: SELL_SELECT_NATIVE,
      },
      {
        text: chainUsed === 5 ? "---" : "USDT",
        callback_data: chainUsed === 5 ? "none" : SELL_SELECT_USDT,
      },
      {
        text: "USDC",
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
        text: "10% \u2705",
        callback_data: SELL_PERCENT_SELECT_1,
      },
      {
        text: "20%",
        callback_data: SELL_PERCENT_SELECT_2,
      },
      {
        text: "30%",
        callback_data: SELL_PERCENT_SELECT_3,
      },
    ],
    [
      {
        text: "50%",
        callback_data: SELL_PERCENT_SELECT_4,
      },
      {
        text: "75%",
        callback_data: SELL_PERCENT_SELECT_5,
      },
      {
        text: "100%",
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
        text: `1%`,
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text: `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`,
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text: "\u270F Custom",
        callback_data: SLIPPAGE_CUSTOM_AMOUNT,
      },
    ],
    [
      {
        text: `======== Swap to ${nativeToken} =======`,
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

  if (chainUsed == 0) {
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
          text: `${nativeToken} \u2705`,
          callback_data: SELL_SELECT_NATIVE,
        },
        {
          text: chainUsed === 5 ? "---" : "USDT",
          callback_data: chainUsed === 5 ? "none" : SELL_SELECT_USDT,
        },
        {
          text: "USDC",
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
          text: "10% \u2705",
          callback_data: SELL_PERCENT_SELECT_1,
        },
        {
          text: "20%",
          callback_data: SELL_PERCENT_SELECT_2,
        },
        {
          text: "30%",
          callback_data: SELL_PERCENT_SELECT_3,
        },
      ],
      [
        {
          text: "50%",
          callback_data: SELL_PERCENT_SELECT_4,
        },
        {
          text: "75%",
          callback_data: SELL_PERCENT_SELECT_5,
        },
        {
          text: "100%",
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
          text: `1%`,
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text: `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`,
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text: "\u270F Custom",
          callback_data: SLIPPAGE_CUSTOM_AMOUNT,
        },
      ],
      [
        {
          text: isPrivate ? "🟢 Private Txn" : "🔴 Private Txn",
          callback_data: PRIVATE_TXN + "sell",
        },
      ],
      [
        {
          text: `======== Swap to ${nativeToken} =======`,
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
  const sellMsg = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard,
    },
  });

  //
  await redis.SET(msg.chat.id + SELL_MESSAGE_MENU, sellMsg.message_id);
};
