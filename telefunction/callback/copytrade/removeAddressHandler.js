const { getCopyTarget } = require("../../../databases");

module.exports = async ({ bot, redis, msg }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

  // get chains
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  // const chains = DATA_CHAIN_LIST;

  //
  await redis.SET(
    msg.chat.id + "_copytrade-opts",
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );

  //
  const targets = await getCopyTarget(
    msg.chat.id,
    chains[chainused].chain_id
  );

  //
  let message = "";

  //
  if (targets.length > 0) {
    //
    let list = `${targets
      .map((x, i) => {
        return `${i + 1}. ${x.target_address}`;
      })
      .join("\n")}`;

    //
    message =
      "<strong>Enter the line number of the address you wish to remove from your copy trade list:</strong>\n";
    // message += "<em>Example: To sell tokens in line 1 & 3, enter:</em>\n<em>1,3</em>\n";
    message +=
      "<em>Example: To remove address in line 1, enter:</em>\n<em>1</em>\n";
    message += `----------------------------\n${list}`;

    //
    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    //
    await redis.SET(msg.chat.id + "_copyrmaddress", thisMessage.message_id);
  } else {
    //
    message = `No address list to copy!`;

    //
    const copyMsg = await redis.GET(msg.chat.id + "_copytrademsg");
    bot.deleteMessage(msg.chat.id, Number(copyMsg));

    //
    await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: "!menu",
            },
            {
              text: "\uD83D\uDED2 Copy Trade",
              callback_data: "!copytrade",
            },
          ],
        ],
      },
    });
  }
};
