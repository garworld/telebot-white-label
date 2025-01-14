const { DATA_CHAIN_LIST } = require("../../../constants/chains");

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
  const message = `<strong>Enter the wallet address that you wish to add to your copy trade list.</strong>\n${Number(chains[chainused].chain_id) === 1399811149 ? "" : "<em>(Starting with 0x….)</em>"}`;

  //
  const thisMessage = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
    },
  });

  //
  await redis.SET(msg.chat.id + "_copyaddaddress", thisMessage.message_id);
};
