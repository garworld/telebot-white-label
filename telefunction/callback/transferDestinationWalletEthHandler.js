const { CHAIN_USED } = require("../../constants/buytoken");
const { TRANSFER_ETH_OPTIONS } = require("../../constants/transfertoken");

module.exports = async ({ bot, redis, msg, action }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED));
  // console.log({ chainused });
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
  const wNumber = Number(action.split(":")[1]);

  //
  await redis.SET(
    msg.chat.id + TRANSFER_ETH_OPTIONS,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
      wallet_number: wNumber,
    })
  );
  // transfer_eth_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  //   wallet_number: wNumber,
  // };

  //
  // const message = `WALLET ADDRESS DESTINATION TO TRANSFER ETH FROM WALLET ${wNumber}`;
  const message = `<strong>Transfer ${nativeToken}</strong>\nEnter the <strong>Destination Wallet Address</strong> as recipient to transfer ${nativeToken} from Wallet-${wNumber}.`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_toaddresstxeth", thisMessage.message_id);
};
