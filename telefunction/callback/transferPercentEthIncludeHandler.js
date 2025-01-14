const {
  BACK_KEYBOARD_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const {
  TRANSFER_PERCENT_ETH_INCLUDES,
  TRANSFER_PERCENT_ETH_3,
  TRANSFER_PERCENT_ETH_2,
  TRANSFER_PERCENT_ETH_1,
  TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK,
} = require("../../constants/transfertoken");

module.exports = async ({ bot, msg, action }) => {
  //
  const wnumbering = action.split(":")[1];

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
              action.split(":")[0].split(TRANSFER_PERCENT_ETH_INCLUDES)[1] ===
              "1"
                ? "20% \u2705"
                : "20%",
            callback_data: `${TRANSFER_PERCENT_ETH_1}:${wnumbering}`,
          },
          {
            text:
              action.split(":")[0].split(TRANSFER_PERCENT_ETH_INCLUDES)[1] ===
              "2"
                ? "50% \u2705"
                : "50%",
            callback_data: `${TRANSFER_PERCENT_ETH_2}:${wnumbering}`,
          },
          {
            text:
              action.split(":")[0].split(TRANSFER_PERCENT_ETH_INCLUDES)[1] ===
              "3"
                ? "100% \u2705"
                : "100%",
            callback_data: `${TRANSFER_PERCENT_ETH_3}:${wnumbering}`,
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
            text: "Enter Destination Wallet & Select Tokens",
            callback_data: `${TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK}:${wnumbering}`,
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
