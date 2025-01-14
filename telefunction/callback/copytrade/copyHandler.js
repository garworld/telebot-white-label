const { copy_type } = require("@prisma/client");
const { Connection } = require("@solana/web3.js");
const { ethers } = require("ethers");

// const summary = require("../../summary");
const { COPYTRADE_SETTINGS } = require("../../../constants/copytrade");
const { getCopycat, getCopyTarget } = require("../../../databases");
// const { checkBalance } = require("../../../helpers");
// const { formatNumber } = require("../../../helpers/abbreviateNumber");
const { copyTradePage } = require("../../modes");
const copyTradeMessage = require("../../messages/copyTradeMessage");

module.exports = async ({ bot, redis, msg, botdb, chains }) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;
  const ethusd = await redis.GET("ethusd");
  const solusd = await redis.GET("solusd");

  // remove last message
  bot.deleteMessage(msg.chat.id, msg.message_id);

  // check if chainused is equal to 2 (avalanche chain) or 3 (metis andromeda) or 5 (base chain)
  if (chainused === 2 || chainused === 3 || chainused === 5) {
    //
    await bot.sendMessage(msg.chat.id, 'This chain is currently not supported', {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: "!menu",
            },
          ],
        ]
      },
    });

    // stop the execution of the function
    return;
  }

  // if (chainused === 3) {
  //   const errorMessage = "Copy Trade is not yet available on Metis Andromeda";
  //   const errorMessageButton = [
  //     [
  //       {
  //         text: "\u2261 Menu",
  //         callback_data: "!menu",
  //       },
  //     ],
  //   ];

  //   // Send the error message and button
  //   await bot.sendMessage(msg.chat.id, errorMessage, {
  //     reply_markup: {
  //       inline_keyboard: errorMessageButton,
  //     },
  //   });

  //   // Stop the execution of the function for metis
  //   return;
  // }

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
  const theCopycat = await getCopycat(
    null,
    chains[chainused].chain_id,
    msg.chat.id
  );

  //
  const copyTarget = await getCopyTarget(
    msg.chat.id,
    chains[chainused].chain_id
  );

  //
  if (theCopycat) {
    if (!Array.isArray(theCopycat)) {
      copyPreparation.chain = theCopycat.chain;
      copyPreparation.wallet_used = theCopycat.wallet_used;
      copyPreparation.copy_type = theCopycat.copy_type;
      copyPreparation.copy_buy = theCopycat.copy_buy;
      copyPreparation.copy_sell = theCopycat.copy_sell;
      copyPreparation.limit_amount = theCopycat.limit_amount;
      copyPreparation.profit_sell = theCopycat.profit_sell;
    }
  }

  //
  if (copyTarget.length > 0) {
    copyPreparation.targets = copyTarget;
  }

  //
  await redis.SET(msg.chat.id + COPYTRADE_SETTINGS, JSON.stringify(copyPreparation));

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
  const copyTradeMsg = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: defaultInlineKey,
    },
  });

  //
  await redis.SET(msg.chat.id + "_copytrademsg", copyTradeMsg.message_id);
};
