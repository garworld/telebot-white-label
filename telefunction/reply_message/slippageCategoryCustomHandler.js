const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  LAST_CHAT,
  PRIVATE_TXN,
} = require("../../constants/buytoken");
const {
  SLIPPAGE_PROMPT,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_CUSTOM,
  SLIPPAGE_OPTIONS,
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
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
} = require("../../constants/coingecko");

module.exports = async ({ bot, msg, redis }) => {
  // console.log("halo");
  try {
    if (
      isNaN(Number(msg.text)) ||
      Number(msg.text) > 100 ||
      Number(msg.text) < 1
    ) {
      // console.log("sini");
      //
      const message = `Please <strong>insert your desired slippage (in %)</strong> for the swap.
              <i>Setting ${SLIPPAGE_PROMPT} increases the risk of being front-run.</i>
              <i>(Default: ${DEFAULT_SLIPPAGE_AMOUNT})</i>`;

      //
      const thisMessage = await bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          force_reply: true,
        },
      });

      //
      await redis.SET(msg.chat.id + SLIPPAGE_CUSTOM, thisMessage.message_id);
    } else {
      // console.log("masuk");
      //
      const slippage_options = JSON.parse(
        await redis.GET(msg.chat.id + SLIPPAGE_OPTIONS)
      );

      //
      const percentAmount = msg.text;
      // console.log(percentAmount);

      //
      const messageToDelete = await redis.GET(msg.chat.id + SLIPPAGE_CUSTOM);
      await redis.DEL(msg.chat.id + SLIPPAGE_CUSTOM);

      //
      bot.deleteMessage(msg.chat.id, Number(messageToDelete));
      bot.deleteMessage(msg.chat.id, msg.message_id);

      const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

      //
      const categoryCheck = await redis.GET(
        msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
      );
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
            text: slippage_options.reply_markup.inline_keyboard[2][0].text,
            callback_data: COINGECKO_SELECTION_WALLET_1,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[2][1].text,
            callback_data: COINGECKO_SELECTION_WALLET_2,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[2][2].text,
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
            text: slippage_options.reply_markup.inline_keyboard[4][0].text,
            callback_data: CATEGORY_SELECT_NATIVE,
          },
          {
            text: chainused === 5 ? "---" : slippage_options.reply_markup.inline_keyboard[4][1].text,
            callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[4][2].text,
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
            text: slippage_options.reply_markup.inline_keyboard[6][0].text,
            callback_data: COINGECKO_SELECTION_ETH_1,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[6][1].text,
            callback_data: COINGECKO_SELECTION_ETH_2,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[6][2].text,
            callback_data: COINGECKO_SELECTION_ETH_3,
          },
        ],
        [
          {
            text: slippage_options.reply_markup.inline_keyboard[7][0].text,
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
            text: `1%`,
            callback_data: SLIPPAGE_SELECTION_1,
          },
          {
            text: `${DEFAULT_SLIPPAGE_AMOUNT}`,
            callback_data: SLIPPAGE_SELECTION_2,
          },
          {
            text: `${percentAmount}% \u2705`,
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
              text: slippage_options.reply_markup.inline_keyboard[2][0].text,
              callback_data: COINGECKO_SELECTION_WALLET_1,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[2][1].text,
              callback_data: COINGECKO_SELECTION_WALLET_2,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[2][2].text,
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
              text: slippage_options.reply_markup.inline_keyboard[4][0].text,
              callback_data: CATEGORY_SELECT_NATIVE,
            },
            {
              text: chainused === 5 ? "---" : slippage_options.reply_markup.inline_keyboard[4][1].text,
              callback_data: chainused === 5 ? "none" : CATEGORY_SELECT_USDT,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[4][2].text,
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
              text: slippage_options.reply_markup.inline_keyboard[6][0].text,
              callback_data: COINGECKO_SELECTION_ETH_1,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[6][1].text,
              callback_data: COINGECKO_SELECTION_ETH_2,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[6][2].text,
              callback_data: COINGECKO_SELECTION_ETH_3,
            },
          ],
          [
            {
              text: slippage_options.reply_markup.inline_keyboard[7][0].text,
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
              text: `1%`,
              callback_data: SLIPPAGE_SELECTION_1,
            },
            {
              text: `${DEFAULT_SLIPPAGE_AMOUNT}`,
              callback_data: SLIPPAGE_SELECTION_2,
            },
            {
              text: `${percentAmount}% \u2705`,
              callback_data: SLIPPAGE_CUSTOM_AMOUNT,
            },
          ],
          [
            {
              text: slippage_options.reply_markup.inline_keyboard[10][0].text,
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
        message_id: slippage_options.message_id,
      });

      // setup last chat for back option in future screens
      await redis.SET(
        msg.chat.id + LAST_CHAT,
        JSON.stringify({
          message: "test",
          message_options: { reply_markup: message_options },
        })
      );
    }
  } catch (err) {
    console.error(err);
  }
};
