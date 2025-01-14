const { copy_type, wallet_number } = require("@prisma/client");

module.exports = (copyPreparation) => {
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
        text: (copyPreparation.wallet_used.includes(wallet_number.FIRST) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-1",
        callback_data: "!copywallet:1",
      },
      {
        text: (copyPreparation.wallet_used.includes(wallet_number.SECOND) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-2",
        callback_data: "!copywallet:2",
      },
      {
        text: (copyPreparation.wallet_used.includes(wallet_number.THIRD) ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Wallet-3",
        callback_data: "!copywallet:3",
      },
    ],
    [
      {
        text: "======== Trading Actions =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: (copyPreparation.copy_buy ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Copy Buys",
        callback_data: "!copyevent:buy",
      },
      {
        text: (copyPreparation.copy_sell ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Copy Sells",
        callback_data: "!copyevent:sell",
      },
    ],
    [
      {
        text: "======== Buy Settings =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: `\u270F Max Spend: ${copyPreparation.limit_amount} ${Number(copyPreparation.chain) === 1399811149 ? "SOL" : "ETH"}`,
        callback_data: "!copymaxspend",
      },
    ],
    [
      {
        text: (copyPreparation.copy_type === copy_type.PERCENT ? "\u2705 " : "") + "Copy % Amount",
        callback_data: "!copyselect:percent",
      },
      {
        text: (copyPreparation.copy_type === copy_type.EXACT ? "\u2705 " : "") + "Copy Exact Amount",
        callback_data: "!copyselect:exact",
      },
    ],
    [
      {
        text: "======= Sell Settings =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: (copyPreparation.profit_sell ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Sell Only When In Profit",
        callback_data: "!copyprofitsell",
      },
    ],
    [
      {
        text: "======= Add / Remove Address =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: "Add Address",
        callback_data: "!copyaddaddress",
      },
      {
        text: "Remove Address",
        callback_data: "!copyrmvaddress",
      },
    ],
  ];
};
