const {
  BACK_KEYBOARD_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
} = require("../../constants/buytoken");
const {
  TRANSFER_AMOUNT_ETH_INCLUDES,
  TRANSFER_AMOUNT_ETH_1,
  TRANSFER_AMOUNT_ETH_2,
  TRANSFER_AMOUNT_ETH_3,
  TRANSFER_CUSTOM_AMOUNT_ETH,
} = require("../../constants/transfertoken");
const redis = require("../../helpers/redis");

module.exports = async ({ bot, msg, action }) => {
  //
  const wnumbering = action.split(":")[1];

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
            text:
              action.split(":")[0].split(TRANSFER_AMOUNT_ETH_INCLUDES)[1] ===
              "1"
                ? `${amountText[0]} ${nativeToken} \u2705`
                : `${amountText[0]} ${nativeToken}`,
            callback_data: `${TRANSFER_AMOUNT_ETH_1}:${wnumbering}`,
          },
          {
            text:
              action.split(":")[0].split(TRANSFER_AMOUNT_ETH_INCLUDES)[1] ===
              "2"
                ? `${amountText[1]} ${nativeToken} \u2705`
                : `${amountText[1]} ${nativeToken}`,
            callback_data: `${TRANSFER_AMOUNT_ETH_2}:${wnumbering}`,
          },
          {
            text:
              action.split(":")[0].split(TRANSFER_AMOUNT_ETH_INCLUDES)[1] ===
              "3"
                ? `${amountText[2]} ${nativeToken} \u2705`
                : `${amountText[2]} ${nativeToken}`,
            callback_data: `${TRANSFER_AMOUNT_ETH_3}:${wnumbering}`,
          },
        ],
        [
          {
            text: "\u270F Custom Amount",
            callback_data: `${TRANSFER_CUSTOM_AMOUNT_ETH}:${wnumbering}`,
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
            callback_data: `${TRANSFER_CUSTOM_AMOUNT_ETH}:${wnumbering}`,
          },
        ],
      ],
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
