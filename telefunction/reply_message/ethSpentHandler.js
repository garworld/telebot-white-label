const {
  BUY_OPTIONS_ID,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  CHAIN_USED,
  LAST_CHAT,
  SLIPPAGE_SELECTION_1: SLIPPAGE_SELECTION_1_BUY,
  SLIPPAGE_SELECTION_2: SLIPPAGE_SELECTION_2_BUY,
  SLIPPAGE_CUSTOM_AMOUNT: SLIPPAGE_CUSTOM_AMOUNT_BUY,
  PRIVATE_TXN,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
} = require("../../constants/buytoken");
const {
  COINGECKO_CATEGORY_NAME,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
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
} = require("../../constants/coingecko");

module.exports = async ({ bot, redis, msg }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
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
  const buy_options = JSON.parse(await redis.GET(msg.chat.id + BUY_OPTIONS_ID));

  //
  let tokenUsed = nativeToken;
  if (buy_options.reply_markup.inline_keyboard[4][1].text.includes("\u2705")) {
    tokenUsed = "USDT";
  }

  if (buy_options.reply_markup.inline_keyboard[4][2].text.includes("\u2705")) {
    tokenUsed = "USDC";
  }
  //
  const prompt_message_buy = `Please insert <strong>${tokenUsed} Amount</strong> to be spent.\n(Example: 0.75)`;
  const prompt_message_category_buy = `Please insert <strong>${tokenUsed} Amount</strong> to be spent. This amount will be split equally into the tokens within the selected category. \n(Example:0.75)`;

  const message =
    msg.reply_to_message.text ===
    prompt_message_buy.replace("<strong>", "").replace("</strong>", "")
      ? prompt_message_buy
      : prompt_message_category_buy;
  if (isNaN(Number(msg.text))) {
    //
    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    //
    await redis.SET(msg.chat.id + "_ethcustom", thisMessage.message_id);
  } else {
    //
    let ethAmount = msg.text;

    if (msg.text[0] === ".") {
      ethAmount = "0" + msg.text;
    }

    //
    const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

    // console.log("BUY OPTS: ", buy_options?.reply_markup?.inline_keyboard);

    //
    const messageToDelete = await redis.GET(msg.chat.id + "_ethcustom");
    await redis.DEL(msg.chat.id + "_ethcustom");

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    bot.deleteMessage(msg.chat.id, msg.message_id);

    let reply_message = {};

    let inline_keyboard = [];

    const categoryNameCheck = await redis.GET(
      msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
    );
    let categoryName;
    if (categoryNameCheck) {
      categoryName = categoryNameCheck.split("/")[0];
    }

    //
    let amountSelect1 = `${amountText[0]} ${nativeToken}`;
    let amountSelect2 = `${amountText[1]} ${nativeToken}`;
    let amountSelect3 = `${amountText[2]} ${nativeToken}`;

    if (
      buy_options.reply_markup.inline_keyboard[4][1].text.includes("\u2705")
    ) {
      amountSelect1 = "100 USDT";
      amountSelect2 = "500 USDT";
      amountSelect3 = "1000 USDT";
      tokenUsed = "USDT";
    }
    if (
      buy_options.reply_markup.inline_keyboard[4][2].text.includes("\u2705")
    ) {
      amountSelect1 = "100 USDC";
      amountSelect2 = "500 USDC";
      amountSelect3 = "1000 USDC";
      tokenUsed = "USDC";
    }

    if (
      msg.reply_to_message.text ===
      prompt_message_buy.replace("<strong>", "").replace("</strong>", "")
    ) {
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
            text: buy_options?.reply_markup.inline_keyboard[2][0]?.text,
            callback_data: BUY_SELECTION_WALLET_1,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[2][1]?.text,
            callback_data: BUY_SELECTION_WALLET_2,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[2][2]?.text,
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
            text: buy_options.reply_markup.inline_keyboard[4][0].text,
            callback_data: BUY_SELECT_NATIVE,
          },
          {
            text: chainused === 5 ? "---" : buy_options.reply_markup.inline_keyboard[4][1].text,
            callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
          },
          {
            text: buy_options.reply_markup.inline_keyboard[4][2].text,
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
            text: `${amountSelect1}`,
            callback_data: BUY_SELECTION_ETH_1,
          },
          {
            text: `${amountSelect2}`,
            callback_data: BUY_SELECTION_ETH_2,
          },
          {
            text: `${amountSelect3}`,
            callback_data: BUY_SELECTION_ETH_3,
          },
        ],
        [
          {
            text: ethAmount + ` ${tokenUsed} \u2705`,
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
            text: buy_options?.reply_markup.inline_keyboard[9][0]?.text,
            callback_data: SLIPPAGE_SELECTION_1_BUY,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[9][1]?.text,
            callback_data: SLIPPAGE_SELECTION_2_BUY,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[9][2]?.text,
            callback_data: SLIPPAGE_CUSTOM_AMOUNT_BUY,
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
            text: buy_options.reply_markup.inline_keyboard[11][0].text,
            callback_data: buy_options.reply_markup.inline_keyboard[11][0].callback_data,
          },
        ],
      ];

      if (chainused === 0) {
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
              text: buy_options?.reply_markup.inline_keyboard[2][0]?.text,
              callback_data: BUY_SELECTION_WALLET_1,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[2][1]?.text,
              callback_data: BUY_SELECTION_WALLET_2,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[2][2]?.text,
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
              text: buy_options.reply_markup.inline_keyboard[4][0].text,
              callback_data: BUY_SELECT_NATIVE,
            },
            {
              text: chainused === 5 ? "---" : buy_options.reply_markup.inline_keyboard[4][1].text,
              callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
            },
            {
              text: buy_options.reply_markup.inline_keyboard[4][2].text,
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
              text: `${amountSelect1}`,
              callback_data: BUY_SELECTION_ETH_1,
            },
            {
              text: `${amountSelect2}`,
              callback_data: BUY_SELECTION_ETH_2,
            },
            {
              text: `${amountSelect3}`,
              callback_data: BUY_SELECTION_ETH_3,
            },
          ],
          [
            {
              text: ethAmount + ` ${tokenUsed} \u2705`,
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
              text: buy_options?.reply_markup.inline_keyboard[9][0]?.text,
              callback_data: SLIPPAGE_SELECTION_1_BUY,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[9][1]?.text,
              callback_data: SLIPPAGE_SELECTION_2_BUY,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[9][2]?.text,
              callback_data: SLIPPAGE_CUSTOM_AMOUNT_BUY,
            },
          ],
          [
            {
              text: buy_options?.reply_markup.inline_keyboard[10][0]?.text,
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
              text: buy_options.reply_markup.inline_keyboard[12][0].text,
              callback_data: buy_options.reply_markup.inline_keyboard[12][0].callback_data,
            },
          ],
        ];
      }

      reply_message = {
        inline_keyboard,
      };
    } else {
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
            text: buy_options?.reply_markup.inline_keyboard[2][0]?.text,
            callback_data: COINGECKO_SELECTION_WALLET_1,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[2][1]?.text,
            callback_data: COINGECKO_SELECTION_WALLET_2,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[2][2]?.text,
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
            text: buy_options.reply_markup.inline_keyboard[4][0].text,
            callback_data: CATEGORY_SELECT_NATIVE,
          },
          {
            text: chainused === 5 ? "---" : buy_options.reply_markup.inline_keyboard[4][1].text,
            callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
          },
          {
            text: buy_options.reply_markup.inline_keyboard[4][2].text,
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
            text: `${amountSelect1}`,
            callback_data: COINGECKO_SELECTION_ETH_1,
          },
          {
            text: `${amountSelect2}`,
            callback_data: COINGECKO_SELECTION_ETH_2,
          },
          {
            text: `${amountSelect3}`,
            callback_data: COINGECKO_SELECTION_ETH_3,
          },
        ],
        [
          {
            text: ethAmount + ` ${tokenUsed} \u2705`,
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
            text: buy_options?.reply_markup.inline_keyboard[9][0]?.text,
            callback_data: SLIPPAGE_SELECTION_1,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[9][1]?.text,
            callback_data: SLIPPAGE_SELECTION_2,
          },
          {
            text: buy_options?.reply_markup.inline_keyboard[9][2]?.text,
            callback_data: SLIPPAGE_CUSTOM_AMOUNT,
          },
        ],
        [
          {
            text: "======== Select Category ========",
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

      if (chainused === 0) {
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
              text: buy_options?.reply_markup.inline_keyboard[2][0]?.text,
              callback_data: COINGECKO_SELECTION_WALLET_1,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[2][1]?.text,
              callback_data: COINGECKO_SELECTION_WALLET_2,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[2][2]?.text,
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
              text: buy_options.reply_markup.inline_keyboard[4][0].text,
              callback_data: CATEGORY_SELECT_NATIVE,
            },
            {
              text: chainused === 5 ? "---" : buy_options.reply_markup.inline_keyboard[4][1].text,
              callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
            },
            {
              text: buy_options.reply_markup.inline_keyboard[4][2].text,
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
              text: `${amountSelect1}`,
              callback_data: COINGECKO_SELECTION_ETH_1,
            },
            {
              text: `${amountSelect2}`,
              callback_data: COINGECKO_SELECTION_ETH_2,
            },
            {
              text: `${amountSelect3}`,
              callback_data: COINGECKO_SELECTION_ETH_3,
            },
          ],
          [
            {
              text: ethAmount + ` ${tokenUsed} \u2705`,
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
              text: buy_options?.reply_markup.inline_keyboard[9][0]?.text,
              callback_data: SLIPPAGE_SELECTION_1,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[9][1]?.text,
              callback_data: SLIPPAGE_SELECTION_2,
            },
            {
              text: buy_options?.reply_markup.inline_keyboard[9][2]?.text,
              callback_data: SLIPPAGE_CUSTOM_AMOUNT,
            },
          ],
          [
            {
              text: buy_options?.reply_markup.inline_keyboard[10][0].text,
              callback_data: PRIVATE_TXN + "category",
            },
          ],
          [
            {
              text: "======== Select Category ========",
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

      reply_message = {
        inline_keyboard,
      };
    }

    await redis.SET(
      msg.chat.id + BUY_OPTIONS_ID,
      JSON.stringify({
        message_id: buy_options.message_id,
        reply_markup: {
          inline_keyboard
        },
      })
    );

    //
    bot.editMessageReplyMarkup(reply_message, {
      chat_id: msg.chat.id,
      message_id: buy_options.message_id,
    });

    // setup last chat for back option in future screens
    await redis.SET(
      msg.chat.id + LAST_CHAT,
      JSON.stringify({
        message: "test",
        message_options: { reply_markup: reply_message },
      })
    );
  }
};
