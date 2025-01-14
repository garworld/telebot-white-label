module.exports = async ({ bot, redis, msg, action }) => {
  //
  const wNumber = Number(action.split(":")[1]);

  //
  await redis.SET(
    msg.chat.id + "_transfer-token-opts",
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
      wallet_number: wNumber,
    })
  );
  // transfer_token_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  const message = `<strong>Transfer Token(s)</strong>\nEnter the <strong>Destination Wallet Address</strong> as recipient to transfer token(s) from Wallet-${wNumber}.`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_toaddresstxtoken", thisMessage.message_id);
};
