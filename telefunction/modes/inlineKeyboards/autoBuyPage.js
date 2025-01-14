const { wallet_number } = require("@prisma/client");

/**
 * @typedef { object } AutoBuyProperties
 * @property { wallet_number[] } walletUsed - Wallet/s used
 * @property { number } chainused - Chainused
 * @property { number } amount - Amount
 * @property { string | null } unit - Unit
 * @property { number } slippage - Slippage
 * @property { boolean } isPrivate - Is Private
 */

/**
 * 
 * @param { AutoBuyProperties } autoBuyProperties 
 * @returns 
 */
module.exports = (autoBuyProperties) => {
  //
  const amountDefault = [100, 1000, 10000];
  const slippageDefault = [1, 10];

  //
  let customAmount = false;
  let customSlippage = false;

  //
  amountDefault.includes(autoBuyProperties.amount) ? customAmount = false : customAmount = true;
  slippageDefault.includes(autoBuyProperties.slippage) ? customSlippage = false : customSlippage = true;

  //
  const chainused = autoBuyProperties.chainused || 0;

  //
  return [
    [
      {
        text: "\u21B6 Back",
        callback_data: "!setting",
      },
      {
        text: "\u2261 Menu",
        callback_data: "!menu",
      }
    ],
    [
      {
        text: "======== Select Wallets =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: autoBuyProperties.walletUsed.includes(wallet_number.FIRST) ? "Wallet-1 \u2705" : "Wallet-1",
        callback_data: "!autowallet:1",
      },
      {
        text: autoBuyProperties.walletUsed.includes(wallet_number.SECOND) ? "Wallet-2 \u2705" : "Wallet-2",
        callback_data: "!autowallet:2",
      },
      {
        text: autoBuyProperties.walletUsed.includes(wallet_number.THIRD) ? "Wallet-3 \u2705" : "Wallet-3",
        callback_data: "!autowallet:3",
      },
    ],
    [
      {
        text: "======== Buy With ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: autoBuyProperties.unit ? "Native Coin" : "Native Coin \u2705",
        callback_data: "!autounit:native",
      },
      {
        text: chainused === 5 ? "---" : (autoBuyProperties.unit ? (autoBuyProperties.unit === "USDT" ? "USDT \u2705" : "USDT") : "USDT"),
        callback_data: chainused === 5 ? "none" : "!autounit:usdt",
      },
      {
        text: autoBuyProperties.unit ? (autoBuyProperties.unit === "USDC" ? "USDC \u2705" : "USDC") : "USDC",
        callback_data: "!autounit:usdc",
      },
    ],
    [
      {
        text: "======= Buy Amount In USD =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: autoBuyProperties.amount === 100 ? "100 USD \u2705" : "100 USD",
        callback_data: "!autoamountselect:1",
      },
      {
        text: autoBuyProperties.amount === 1000 ? "1000 USD \u2705" : "1000 USD",
        callback_data: "!autoamountselect:2",
      },
      {
        text: autoBuyProperties.amount === 10000 ? "10000 USD \u2705" : "10000 USD",
        callback_data: "!autoamountselect:3",
      },
    ],
    [
      {
        text: customAmount ? `${autoBuyProperties.amount.toString()} USD \u2705` : "\u270F Custom Amount",
        callback_data: "!autoamountcustom",
      },
    ],
    [
      {
        text: "======== Select Slippage ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: autoBuyProperties.slippage === 1 ? "1% \u2705" : "1%",
        callback_data: "!autoslippageselect:1",
      },
      {
        text: autoBuyProperties.slippage === 10 ? "10% \u2705" : "10%",
        callback_data: "!autoslippageselect:2",
      },
      {
        text: customSlippage ? `${autoBuyProperties.slippage.toString()}% \u2705` : "\u270F Custom",
        callback_data: "!autoslippagecustom",
      },
    ],
    [
      {
        text: autoBuyProperties.isPrivate ? "🟢 Private Txn (on ETH Mainnet only)" : "🔴 Private Txn",
        callback_data: "!autoprivateselect",
      },
    ],
    [
      {
        text: "Submit",
        callback_data: "!autobuysubmit",
      },
    ],
  ];
};
