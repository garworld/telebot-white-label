const { copy_type } = require("@prisma/client");
const { Connection } = require("@solana/web3.js");
const { ethers } = require("ethers");

const copyTradeMessage = require("../../messages/copyTradeMessage");
const { copyTradePage } = require("../../modes");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const {
  removeCopyTarget,
  getCopycat,
  updateWebhook,
  getCopyTarget,
} = require("../../../databases");

module.exports = async ({
  bot,
  redis,
  botdb,
  msg,
  chains,
}) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;
  const ethusd = await redis.GET("ethusd");
  const solusd = await redis.GET("solusd");

  //
  const copyTradeOptions = await redis.GET(msg.chat.id + "_copytrade-opts");
  const copyTradeMsg = await redis.GET(msg.chat.id + "_copytrademsg");
  const copyTradeHandler = await redis.GET(msg.chat.id + "_copyrmaddress");

  copyTradeOptions ? await redis.DEL(msg.chat.id + "_copytrade-opts") : null;
  copyTradeHandler ? await redis.DEL(msg.chat.id + "_copyrmaddress") : null;

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
    const copyTarget = await getCopyTarget(
      msg.chat.id,
      chains[chainused].chain_id
    );

    //
    copyPreparation.targets = copyTarget;
  }

  if (
    isNaN(Number(msg.text)) ||
    Number(msg.text) < 1 ||
    Number(msg.text) > copyPreparation.targets.length
  ) {
    //
    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    copyTradeHandler ? bot.deleteMessage(msg.chat.id, copyTradeHandler) : null;

    // the message to return
    const message = "\uD83D\uDD34 Error: Not on list.";

    //
    bot.sendMessage(msg.chat.id, message, {
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
  } else {
    //
    const removingTarget = await removeCopyTarget(
      msg.chat.id,
      chains[chainused].chain_id,
      copyPreparation.targets[Number(msg.text) - 1].target_address
    );

    //
    const copier = await getCopycat(
      copyPreparation.targets[Number(msg.text) - 1].target_address,
      chains[chainused].chain_id,
      null
    );

    //
    await Promise.all([removingTarget, copier]);

    //
    if (Array.isArray(copier)) {
      copier.length < 1
        ? await updateWebhook(
            chains[chainused].chain_id,
            copyPreparation.targets[Number(msg.text) - 1].webhook_id,
            copyPreparation.targets[Number(msg.text) - 1].target_address,
            false
          )
        : null;
    }

    //
    const copyTarget = await getCopyTarget(
      msg.chat.id,
      chains[chainused].chain_id
    );

    //
    copyPreparation.targets = copyTarget;

    // default inline keyboard
    const defaultInlineKey = copyTradePage(copyPreparation);

    //
    let provider = null;
    let usdprice = 0;

    //
    if (chains[chainused].chain_id === 1399811149) {
      // provider
      provider = new Connection(
        chains[chainused].rpc_provider,
        "confirmed"
      );

      //
      usdprice = solusd;
    } else {
      // provider
      provider = new ethers.providers.JsonRpcProvider(
        chains[chainused].rpc_provider
      );

      //
      usdprice = ethusd;
    }

    //
    const message = await copyTradeMessage(msg, copyPreparation, provider, chains, chainused, usdprice, botdb);

    //
    msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
    copyTradeHandler ? bot.deleteMessage(msg.chat.id, copyTradeHandler) : null;

    //
    bot.editMessageText(message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: msg.chat.id,
      message_id: copyTradeMsg,
      reply_markup: {
        inline_keyboard: defaultInlineKey,
      }
    });
  }
};
