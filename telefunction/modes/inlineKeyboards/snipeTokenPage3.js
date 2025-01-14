const { formatNumber } = require("../../../helpers/abbreviateNumber");

module.exports = (snipingPreparation) => {
  return [
    [
      {
        text: "\u2261 Menu",
        callback_data: "!menu",
      },
    ],
    [
      {
        text: "======== Main Settings =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: "\u270F Approve GWEI: " + snipingPreparation.approve_gwei,
        callback_data: "!snipegwei:approve",
      },
      // {
      //   text: "\u270F Sell GWEI: " + snipingPreparation.sell_gwei,
      //   callback_data: "!snipegwei:sell",
      // },
    ],
    // [
    //   {
    //     text: "\u270F Anti-Rug GWEI: "  + snipingPreparation.anti_rug_gwei,
    //     callback_data: "!snipegwei:anti-rug",
    //   },
    // ],
    [
      {
        text: "\u270F Buy Tax Limit: " + formatNumber(snipingPreparation.buy_tax) + "%",
        callback_data: "!snipebuytax",
      },
      // {
      //   text: "\u270F Sell Tax Limit: " + formatNumber(snipingPreparation.sell_tax) + "%",
      //   callback_data: "!snipeselltax",
      // },
    ],
    [
      {
        text: "\u270F Min Liquidity: " + formatNumber(snipingPreparation.min_liquidity) + " USD",
        callback_data: "!snipeminliq",
      },
      {
        text: "\u270F Max Liquidity: " + formatNumber(snipingPreparation.max_liquidity) + " USD",
        callback_data: "!snipemaxliq",
      },
    ],
    [
      {
        text: "=========== Settings Navigator ===========",
        callback_data: "none",
      },
    ],
    [
      {
        text: "⬅️ Previous Settings",
        callback_data: "!snipesettings1",
      },
      {
        text: "Submit",
        callback_data: "!snipesettingssubmit",
      },
    ],
  ];
};
