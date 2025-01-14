module.exports = async ({ bot, redis, msg, timeouting }) => {
  //
  const lastChat = JSON.parse(await redis.GET(msg.chat.id + "_lastchat"));
  await redis.DEL(msg.chat.id + "_lastchat");

  //
  // console.log("BACK CONTENT: ", JSON.stringify(lastChat));

  //
  if (lastChat) {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.sendMessage(msg.chat.id, lastChat.message, lastChat.message_options);

    //
    await redis.SET(
      msg.chat.id + "_lastchat",
      JSON.stringify({
        message: lastChat.message,
        message_options: lastChat.message_options,
      })
    );

    //
    if (timeouting) clearTimeout(timeouting);
  }
};
