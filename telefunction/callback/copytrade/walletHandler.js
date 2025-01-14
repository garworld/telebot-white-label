const { copy_type, wallet_number } = require("@prisma/client");
const { Connection } = require("@solana/web3.js");
const { ethers } = require("ethers");

const { copyTradePage } = require("../../modes");
const copyTradeMessage = require("../../messages/copyTradeMessage");
// const summary = require("../../summary");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const {
  // getCopycat,
  // getCopyTarget,
  saveCopycat,
} = require("../../../databases");
// const { checkBalance } = require("../../../helpers");
// const { formatNumber } = require("../../../helpers/abbreviateNumber");

module.exports = async ({
  bot,
  redis,
  action,
  msg,
  chains,
  botdb,
}) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;
  const ethusd = await redis.GET("ethusd");
  const solusd = await redis.GET("solusd");

  // //
  // console.log("PICK WALLET #1");

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

    switch (Number(action.split(":")[1])) {
      case 1:
        if (copyPreparation.wallet_used.includes(wallet_number.FIRST)) {
          copyPreparation.wallet_used.splice(
            copyPreparation.wallet_used.indexOf(wallet_number.FIRST),
            1
          );
        } else {
          copyPreparation.wallet_used.push(wallet_number.FIRST);
        }
        break;
      case 2:
        if (copyPreparation.wallet_used.includes(wallet_number.SECOND)) {
          copyPreparation.wallet_used.splice(
            copyPreparation.wallet_used.indexOf(wallet_number.SECOND),
            1
          );
        } else {
          copyPreparation.wallet_used.push(wallet_number.SECOND);
        }
        break;
      case 3:
        if (copyPreparation.wallet_used.includes(wallet_number.THIRD)) {
          copyPreparation.wallet_used.splice(
            copyPreparation.wallet_used.indexOf(wallet_number.THIRD),
            1
          );
        } else {
          copyPreparation.wallet_used.push(wallet_number.THIRD);
        }
        break;
      default:
        if (copyPreparation.wallet_used.includes(wallet_number.FIRST)) {
          copyPreparation.wallet_used.splice(
            copyPreparation.wallet_used.indexOf(wallet_number.FIRST),
            1
          );
        } else {
          copyPreparation.wallet_used.push(wallet_number.FIRST);
        }
        break;
    }

    await redis.SET(
      msg.chat.id + COPYTRADE_SETTINGS,
      JSON.stringify(copyPreparation)
    );
  }

  //
  // console.log("PICK WALLET #2");

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

  // //
  // console.log("PICK WALLET #3");

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

  // bot.editMessageReplyMarkup(
  //   {
  //     inline_keyboard: defaultInlineKey,
  //   },
  //   {
  //     chat_id: msg.chat.id,
  //     message_id: msg.message_id,
  //   }
  // );

  bot.editMessageText(message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: defaultInlineKey,
    }
  });
};
