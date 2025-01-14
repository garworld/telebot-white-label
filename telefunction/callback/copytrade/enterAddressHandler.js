const { copy_type } = require("@prisma/client");
const { Connection } = require("@solana/web3.js");
const { ethers } = require("ethers");

const copyTradeMessage = require("../../messages/copyTradeMessage");
const { copyTradePage } = require("../../modes");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const {
  getWebhook,
  updateWebhook,
  createWebhook,
  saveCopyTarget,
  getCopyTarget,
} = require("../../../databases");

module.exports = async ({ bot, redis, botdb, msg, chains }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;
  const ethusd = await redis.GET("ethusd");
  const solusd = await redis.GET("solusd");

  //
  const copyTradeOptions = await redis.GET(msg.chat.id + "_copytrade-opts");
  const copyTradeMsg = await redis.GET(msg.chat.id + "_copytrademsg");
  const copyTradeHandler = await redis.GET(msg.chat.id + "_copyaddaddress");

  copyTradeOptions ? await redis.DEL(msg.chat.id + "_copytrade-opts") : null;
  copyTradeHandler ? await redis.DEL(msg.chat.id + "_copyaddaddress") : null;

  //
  if (Number(chains[chainused].chain_id) !== 1399811149) {
    if (!ethers.utils.isAddress(msg.text)) {
      //
      msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;
      copyTradeHandler ? bot.deleteMessage(msg.chat.id, copyTradeHandler) : null;
  
      //
      const message = "<strong>Enter the wallet address that you wish to add to your copy trade list.</strong>\n<em>(Starting with 0x….)</em>";
  
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
    }
  }

  // //
  // const messageToDelete = await redis.GET(msg.chat.id + "_copyaddaddress");
  // await redis.DEL(msg.chat.id + "_copyaddaddress");

  //
  const dWebhook = await getWebhook(chains[chainused].chain_id);

  //
  let dHookKey = null;

  //
  if (dWebhook.id) {
    // updating webhook
    dHookKey = await updateWebhook(chains[chainused].chain_id, dWebhook.id, msg.text, true);

    //
    // console.log("UPDATING WEBHOOK: ", {
    //   updateWebhook: chains[chainused].chain_id + ":" + dWebhook.id + ":" + msg.text + ":" + true
    // });
  } else {
    // creating webhook
    dHookKey = await createWebhook(chains[chainused].chain_id, msg.text);

    //
    // console.log("CREATING WEBHOOK: ", {
    //   createWebhook: chains[chainused].chain_id + ":" + msg.text
    // });
  }

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
  await saveCopyTarget(
    msg.chat.id,
    chains[chainused].chain_id,
    msg.text,
    dHookKey.id
  );

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
};
