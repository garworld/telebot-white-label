const {
  BACK_KEYBOARD_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
} = require("../../constants/buytoken");
const {
  TRANSFER_ETH_OPTIONS,
  TRANSFER_CUSTOM_TRANSACTION_ETH,
  TRANSFER_AMOUNT_ETH_1,
  TRANSFER_AMOUNT_ETH_2,
  TRANSFER_AMOUNT_ETH_3,
  TRANSFER_CUSTOM_AMOUNT_ETH,
  TRANSFER_DESTINATION_WALLET_ETH_CALLBACK,
} = require("../../constants/transfertoken");

module.exports = async ({ bot, redis, msg }) => {
  {
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

    if (isNaN(Number(msg.text))) {
      //
      const message = `Please insert <strong>${nativeToken} Amount</strong> to be transferred.\n(Example: 0.75)`;

      //
      const thisMessage = await bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          force_reply: true,
        },
      });

      //
      await redis.SET(
        msg.chat.id + TRANSFER_CUSTOM_TRANSACTION_ETH,
        thisMessage.message_id
      );
    } else {
      //
      const transferEthOpts = JSON.parse(
        await redis.GET(msg.chat.id + TRANSFER_ETH_OPTIONS)
      );

      //
      const ethAmount = msg.text;

      //
      const messageToDelete = await redis.GET(
        msg.chat.id + TRANSFER_CUSTOM_TRANSACTION_ETH
      );
      await redis.DEL(msg.chat.id + TRANSFER_CUSTOM_TRANSACTION_ETH);

      //
      bot.deleteMessage(msg.chat.id, Number(messageToDelete));
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
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
                text: `${amountText[0]} ${nativeToken}`,
                callback_data: `${TRANSFER_AMOUNT_ETH_1}:${transferEthOpts?.wallet_number}`,
              },
              {
                text: `${amountText[1]} ${nativeToken}`,
                callback_data: `${TRANSFER_AMOUNT_ETH_2}:${transferEthOpts?.wallet_number}`,
              },
              {
                text: `${amountText[2]} ${nativeToken}`,
                callback_data: `${TRANSFER_AMOUNT_ETH_3}:${transferEthOpts?.wallet_number}`,
              },
            ],
            [
              {
                text: ethAmount + ` ${nativeToken} \u2705`,
                callback_data: `${TRANSFER_CUSTOM_AMOUNT_ETH}:${transferEthOpts?.wallet_number}`,
              },
            ],
            [
              {
                text: "======== Send Tokens =======",
                callback_data: "none",
              },
            ],
            [
              {
                text: "Enter Destination Wallet & Send Tx",
                callback_data: `${TRANSFER_DESTINATION_WALLET_ETH_CALLBACK}:${transferEthOpts?.wallet_number}`,
              },
            ],
          ],
        },
        {
          chat_id: msg.chat.id,
          message_id: transferEthOpts?.message_id,
        }
      );
    }
  }
};
