const { SNIPE_SETTINGS } = require("../../../constants/sniping");
const { snipeTokenPage2 } = require("../../modes");

module.exports = async ({ bot, msg, redis }) => {
  //
  let snipingPreparation = {
    address: "-",
    amount: 0.1,
    tip: 0.01,
    slippage: 100,
    max_spend: 0.0,
    wallet_used: [],
    first_or_fail: true, // check gas price -1 wei , if fail on the same block, then failed
    degen_mode: true, // * skip for tax (to token owner) the upper than limit if false
    anti_rug: false, // * if true, sell first than the unexpected tax
    max_tx: false, // if true, max tx set on contract > our spend limit to transaction then revert
    min_tx: false, // if true, min tx set on contract > our spend limit to transaction then revert
    pre_approve: false, // if true, direct approve when snipe buying is succeedeed
    tx_on_blacklist: false, // * should tx even on blacklisted list
    approve_gwei: 30, // adding this amount of gwei then gas price
    sell_gwei: 30, // * when sell
    anti_rug_gwei: 30, // * when anti rug
    buy_tax: 10, // * higher than set tax on contract, then buy
    sell_tax: 10, // * higher then set tax on contract, then sell
    min_liquidity: 10, // on USD convert to ETH, if liquidity lower than this, then not trigger
    max_liquidity: 100, // on USD convert to ETH, if liquidity higher than this, then not trigger
  };

  const theSnipingCache = await redis.GET(msg.chat.id + SNIPE_SETTINGS);

  if (theSnipingCache) {
    let { sniperMode, targetSnipe } = JSON.parse(theSnipingCache);
    // console.log("CACHE: ", { sniperMode, targetSnipe });

    sniperMode.pre_approve ? sniperMode.pre_approve = false : sniperMode.pre_approve = true;

    await redis.SET(
      msg.chat.id + SNIPE_SETTINGS,
      JSON.stringify({
        sniperMode,
        targetSnipe,
      })
    );

    if (sniperMode) {
      snipingPreparation.wallet_used = sniperMode.wallet_used;
      snipingPreparation.first_or_fail = sniperMode.first_or_fail;
      snipingPreparation.degen_mode = sniperMode.degen_mode;
      snipingPreparation.anti_rug = sniperMode.anti_rug;
      snipingPreparation.max_tx = sniperMode.max_tx;
      snipingPreparation.min_tx = sniperMode.min_tx;
      snipingPreparation.pre_approve = sniperMode.pre_approve;
      snipingPreparation.tx_on_blacklist = sniperMode.tx_on_blacklist;
      snipingPreparation.approve_gwei = sniperMode.approve_gwei;
      snipingPreparation.sell_gwei = sniperMode.sell_gwei;
      snipingPreparation.anti_rug_gwei = sniperMode.anti_rug_gwei;
      snipingPreparation.buy_tax = sniperMode.buy_tax;
      snipingPreparation.sell_tax = sniperMode.sell_tax;
      snipingPreparation.min_liquidity = sniperMode.min_liquidity;
      snipingPreparation.max_liquidity = sniperMode.max_liquidity;
    }

    if (targetSnipe.length > 0) {
      snipingPreparation.address = targetSnipe[0].address;
      snipingPreparation.amount = targetSnipe[0].amount;
      snipingPreparation.tip = targetSnipe[0].tip;
      snipingPreparation.slippage = targetSnipe[0].slippage;
    }
  }

  //   console.log({ snipingPreparation });

  // default inline keyboard
  const defaultInlineKey = snipeTokenPage2(snipingPreparation);

  //   console.log({
  //     inline_keyboard: defaultInlineKey[2],
  //   });

  bot.editMessageReplyMarkup(
    {
      inline_keyboard: defaultInlineKey,
    },
    {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    }
  );
};
