const { copy_type } = require("@prisma/client");

const { copyTradePage } = require("../../modes");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const { saveCopycat } = require("../../../databases");

module.exports = async ({ bot, redis, msg, chains }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

  //
  const copyTradeOptions = await redis.GET(msg.chat.id + "_copytrade-opts");
  const copyTradeMsg = await redis.GET(msg.chat.id + "_copytrademsg");
  const copyTradeHandler = await redis.GET(msg.chat.id + "_copymaxspend");

  copyTradeOptions ? await redis.DEL(msg.chat.id + "_copytrade-opts") : null;
  copyTradeHandler ? await redis.DEL(msg.chat.id + "_copymaxspend") : null;

  if (isNaN(Number(msg.text))) {
    //
    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    copyTradeHandler ? bot.deleteMessage(msg.chat.id, copyTradeHandler) : null;

    //
    const message =
      `<strong>Insert the maximum ${Number(chains[chainused].chain_id) === 1399811149 ? "SOL" : "ETH"} Amount per transaction to be spent.</strong>\n(Example: 0.75)`;

    //
    const thisMessage = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    });

    //
    await redis.SET(msg.chat.id + "_copymaxspend", thisMessage.message_id);
  } else {
    //
    let copyPreparation = {
      chain: chains[chainused].chain_id,
      wallet_used: [],
      copy_type: copy_type.EXACT,
      copy_buy: false,
      copy_sell: false,
      limit_amount: 0.1,
      profit_sell: false,
      targets: [],
    }

    //
    const theCopyCache = await redis.GET(msg.chat.id + COPYTRADE_SETTINGS);

    //
    if (theCopyCache) {
      copyPreparation = JSON.parse(theCopyCache);
      // console.log("CACHE: ", copyPreparation);

      //
      let tokenAmount = 0;

      //
      if (msg.text[0] === ".") {
        tokenAmount = "0" + msg.text;
      } else {
        tokenAmount = Number(msg.text);
      }

      copyPreparation.limit_amount = Number(tokenAmount);
    }

    await redis.SET(
      msg.chat.id + COPYTRADE_SETTINGS,
      JSON.stringify(copyPreparation)
    );

    //
    await saveCopycat(
      msg.chat.id,
      chains[chainused].chain_id,
      {
        chain: copyPreparation.chain,
        wallet_used: copyPreparation.wallet_used,
        copy_type: copyPreparation.copy_type,
        copy_buy: copyPreparation.copy_buy,
        copy_sell: copyPreparation.copy_sell,
        limit_amount: copyPreparation.limit_amount,
        profit_sell: copyPreparation.profit_sell,
      }
    );

    // default inline keyboard
    const defaultInlineKey = copyTradePage(copyPreparation);

    // console.log({
    //   inline_keyboard: defaultInlineKey[2],
    // });

    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    copyTradeHandler ? bot.deleteMessage(msg.chat.id, copyTradeHandler) : null;

    bot.editMessageReplyMarkup(
      {
        inline_keyboard: defaultInlineKey,
      },
      {
        chat_id: msg.chat.id,
        message_id: copyTradeMsg,
      }
    );
  }
};
