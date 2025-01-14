const { CHAIN_USED } = require("../../constants/buytoken");
const {
  TRANSFER_ETH_OPTIONS,
  TRANSFER_CONTINUE_ETH,
  TRANSFER_CANCEL_ETH,
} = require("../../constants/transfertoken");

module.exports = async ({ bot, redis, msg, summary }) => {
  //
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
  const walletn = Number(
    msg.reply_to_message.text.split("from Wallet-")[1].split(".")[0]
  );

  //
  let transferEthOpts = JSON.parse(
    await redis.GET(msg.chat.id + TRANSFER_ETH_OPTIONS)
  );
  transferEthOpts.to = msg.text;
  await redis.SET(
    msg.chat.id + TRANSFER_ETH_OPTIONS,
    JSON.stringify(transferEthOpts)
  );

  //
  // console.log("FROM WALLET: ", walletn);
  // console.log("ADDRESS TO TRANSFER: ", msg.text);

  //
  let amount = 0.0;

  //
  transferEthOpts?.reply_markup.inline_keyboard[2].forEach((y) => {
    if (y.text.includes("\u2705")) {
      // console.log(y.text.split(" ETH")[0]);
      amount = Number(y.text.split(` ${nativeToken}`)[0]);
      // console.log("AMOUNT: ", amount);
    }
  });

  //
  if (amount === 0.0) {
    // console.log(
    //   "TX ETH OPTS: ",
    //   transferEthOpts?.reply_markup.inline_keyboard[3][0].text
    // );
    amount = transferEthOpts?.reply_markup.inline_keyboard[3][0].text.split(
      ` ${nativeToken}`
    )[0];
  }

  //
  // console.log("AMOUNT TO TRANSFER: ", amount.toString());
  // console.log(amount);

  //
  let message = await summary(msg);
  message += "<strong>Transfer Summary</strong>\n\n";
  message += `<strong>Send:</strong> ${amount} ${nativeToken}\n`;
  message += `<strong>To:</strong> ${transferEthOpts?.to}\n`;
  message += "----------------------------\nDo you want to continue?\n";

  // console.log("TRANSFER ETH OPTS: ", transferEthOpts);

  // //
  // const gettingWallet = await getWallet(msg.chat.id, walletn);

  // //
  // const response = await transferETH(
  //   chainused,
  //   msg.text,
  //   amount.toString(),
  //   gettingWallet
  // );

  //
  bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Yes, Continue",
            callback_data: TRANSFER_CONTINUE_ETH,
          },
          {
            text: "No, Cancel",
            callback_data: TRANSFER_CANCEL_ETH,
          },
        ],
      ],
    },
  });
};
