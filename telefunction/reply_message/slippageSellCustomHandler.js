const {
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_TXN,
  CHAIN_USED,
} = require("../../constants/buytoken");
const {
  SLIPPAGE_PROMPT,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_CUSTOM,
  SLIPPAGE_OPTIONS,
  SLIPPAGE_CUSTOM_AMOUNT,
  SELL_SELECT_TOKENS,
  SELL_PERCENT_SELECT_1,
  SELL_PERCENT_SELECT_2,
  SELL_PERCENT_SELECT_3,
  SELL_PERCENT_SELECT_4,
  SELL_PERCENT_SELECT_5,
  SELL_PERCENT_SELECT_6,
  SELL_PERCENT_CUSTOM_AMOUNT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SELL_SELECT_NATIVE,
  SELL_SELECT_USDT,
  SELL_SELECT_USDC,
} = require("../../constants/selltoken");

module.exports = async ({ bot, msg, redis }) => {
  // console.log("MASUK SINI");
  try {
    if (
      isNaN(Number(msg.text)) ||
      Number(msg.text) > 100 ||
      Number(msg.text) < 1
    ) {
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
      const slippage_options = JSON.parse(
        await redis.GET(msg.chat.id + SLIPPAGE_OPTIONS)
      );

      //
      let tokenUsed = nativeToken;
      if (
        slippage_options.reply_markup.inline_keyboard[2][1].text.includes(
          "\u2705"
        )
      ) {
        tokenUsed = "USDT";
      }
      if (
        slippage_options.reply_markup.inline_keyboard[2][2].text.includes(
          "\u2705"
        )
      ) {
        tokenUsed = "USDC";
      }

      //
      const percentAmount = msg.text;

      //
      const messageToDelete = await redis.GET(msg.chat.id + SLIPPAGE_CUSTOM);
      await redis.DEL(msg.chat.id + SLIPPAGE_CUSTOM);

      //
      bot.deleteMessage(msg.chat.id, Number(messageToDelete));
      bot.deleteMessage(msg.chat.id, msg.message_id);
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
            text: slippage_options.reply_markup.inline_keyboard[2][0].text,
            callback_data: SELL_SELECT_NATIVE,
          },
          {
            text: chainused === 5 ? "---" : slippage_options.reply_markup.inline_keyboard[2][1].text,
            callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[2][2].text,
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
            text: slippage_options.reply_markup.inline_keyboard[4][0].text,
            callback_data: SELL_PERCENT_SELECT_1,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[4][1].text,
            callback_data: SELL_PERCENT_SELECT_2,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[4][2].text,
            callback_data: SELL_PERCENT_SELECT_3,
          },
        ],
        [
          {
            text: slippage_options.reply_markup.inline_keyboard[5][0].text,
            callback_data: SELL_PERCENT_SELECT_4,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[5][1].text,
            callback_data: SELL_PERCENT_SELECT_5,
          },
          {
            text: slippage_options.reply_markup.inline_keyboard[5][2].text,
            callback_data: SELL_PERCENT_SELECT_6,
          },
        ],
        [
          {
            text: slippage_options.reply_markup.inline_keyboard[6][0].text,
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
              text: slippage_options.reply_markup.inline_keyboard[2][0].text,
              callback_data: SELL_SELECT_NATIVE,
            },
            {
              text: chainused === 5 ? "---" : slippage_options.reply_markup.inline_keyboard[2][1].text,
              callback_data: chainused === 5 ? "none" : SELL_SELECT_USDT,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[2][2].text,
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
              text: slippage_options.reply_markup.inline_keyboard[4][0].text,
              callback_data: SELL_PERCENT_SELECT_1,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[4][1].text,
              callback_data: SELL_PERCENT_SELECT_2,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[4][2].text,
              callback_data: SELL_PERCENT_SELECT_3,
            },
          ],
          [
            {
              text: slippage_options.reply_markup.inline_keyboard[5][0].text,
              callback_data: SELL_PERCENT_SELECT_4,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[5][1].text,
              callback_data: SELL_PERCENT_SELECT_5,
            },
            {
              text: slippage_options.reply_markup.inline_keyboard[5][2].text,
              callback_data: SELL_PERCENT_SELECT_6,
            },
          ],
          [
            {
              text: slippage_options.reply_markup.inline_keyboard[6][0].text,
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
              text: slippage_options.reply_markup.inline_keyboard[9][0]?.text,
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
          message_id: slippage_options.message_id,
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};
