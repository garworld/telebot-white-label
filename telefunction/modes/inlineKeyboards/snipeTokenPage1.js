const { wallet_number } = require("@prisma/client");

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
        text: "======== Active Wallets =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: (snipingPreparation.wallet_used.includes(wallet_number.FIRST) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-1",
        callback_data: "!snipewallet:1",
      },
      {
        text: (snipingPreparation.wallet_used.includes(wallet_number.SECOND) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-2",
        callback_data: "!snipewallet:2",
      },
      {
        text: (snipingPreparation.wallet_used.includes(wallet_number.THIRD) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-3",
        callback_data: "!snipewallet:3",
      },
    ],
    [
      {
        text: "======== Main Settings ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: "\u270F Token: " + snipingPreparation.address,
        callback_data: "!snipeaddress",
      },
    ],
    [
      {
        text: "\u270F Snipe Amount: " + snipingPreparation.amount + " ETH",
        callback_data: "!snipeamount",
      },
    ],
    [
      {
        text: "\u270F Tip Amount: " + snipingPreparation.tip + " ETH",
        callback_data: "!snipetip",
      },
    ],
    // [
    //   {
    //     text: "\u270F Slippage: " + snipingPreparation.slippage + "%",
    //     callback_data: "!snipeslippage",
    //   },
    // ],
    [
      {
        text: "=========== Settings Navigator ===========",
        callback_data: "none",
      },
    ],
    [
      {
        text: "Next Settings ➡️",
        callback_data: "!snipesettings1",
      },
    ],
  ];
};
