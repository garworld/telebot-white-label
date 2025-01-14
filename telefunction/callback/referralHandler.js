const { MENU_KEYBOARD_CALLBACK_DATA } = require("../../constants/buytoken");
const { getReferralKey } = require("../../databases");
const getReferenceNumber = require("../../databases/getReferenceNumber");
const getReferralPoint = require("../../databases/getReferralPoint");
const saveWallet = require("../../databases/saveWallet");
const { encodeReferral } = require("../../helpers/referralGenerator");

module.exports = async ({ bot, msg }) => {
  //
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  let referral = await getReferralKey(msg.chat.id);
  let referralKey = referral.key;

  if (!referral.key) {
    referralKey = encodeReferral(msg.chat.id);
    await saveWallet(msg.chat.id, referralKey);
  }

  //
  const agentsReferred = await getReferenceNumber(msg.chat.id);

  //
  const referralPoints = await getReferralPoint(msg.chat.id);

  const link = `https://t.me/${process.env.TELEBOT_USERNAME}?start=${referralKey}`;

  //
  let message = "*Referral Link:*\n";
  message += `\`${link}\``;
  message += "\n----------------------------\n";
  message += `Agents Referred: ${agentsReferred}\n`;
  message += `Points from Referral: ${referralPoints}\n----------------------------\n`;
  message +=
    "_You will receive 30% of the espionage points earned by every referred agent._\n";
  message += `[Learn more](https://docs.jamesbot.ai/extras/referral-system)\n`;

  //
  bot.sendMessage(msg.chat.id, message, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u21B6 Back",
            callback_data: "!point",
          },
        ],
      ],
    },
  });
};
