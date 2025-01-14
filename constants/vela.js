const VELA_TRADEBOT_URL_EXECUTE =
  "https://api.vela.exchange/trade-bots/execute";
const VELA_TRADEBOT_URL = "https://api.vela.exchange/trade-bots";
const VELA_TRADEBOT_API_DOCS =
  "https://docs.vela.exchange/vela-knowledge-base/developers/trade-bots-api#how-to-create-an-api-key-on-the-vela-app";
const VELA_APP_WITH_REFERRAL_LINK = "https://app.vela.exchange/?refer=5Q1A6BWG";

const VELA_LONG_CALLBACK_DATA = "!velaLong";
const VELA_SHORT_CALLBACK_DATA = "!velaShort";
const VELA_SELECT_TOKEN_ID_CALLBACK = "!selectVelaTokenId";
const VELA_ORDER_COLLATERAL_AMOUNT_CALLBACK = "!velaOrderCollateralAmount";
const VELA_ORDER_AMOUNT_CALLBACK = "!velaOrderAmount";
const VELA_ORDER_SLIPPAGE_CALLBACK = "!velaOrderSlippage";
const VELA_LIMIT_PRICE_CALLBACK = "!velaOrderLimitPrice";
const VELA_STOP_PRICE_CALLBACK = "!velaOrderStopPrice";
const VELA_TAKE_PROFIT_TOGGLE_CALLBACK = "!velaOrderTakeProfitToggle";
const VELA_STOP_LOSS_TOGGLE_CALLBACK = "!velaOrderStopLossToggle";
const VELA_TAKE_PROFIT_VALUE_CALLBACK = "!velaOrderTakeProfitValue";
const VELA_STOP_LOSS_VALUE_CALLBACK = "!velaOrderStopLossValue";
const VELA_PLACE_ORDER_CALLBACK = "!velaPlaceOrder";
const VELA_ORDER_POSITION_CALLBACK = "!velaOrderPosition";
const VELA_ORDER_SET_CHAIN_CALLBACK = "!velaOrderSetChain";

const VELA_ORDER_COLLATERAL_ID = "_velaOrderCollateral";
const VELA_ORDER_COLLATERAL_MESSAGE_ID = "_velaOrderCollateral_messageId";
const VELA_ASSET_ID = "_velaAssetId";
const VELA_ORDER_IS_LONG = "_velaOrderIsLong";
const VELA_ORDER_POSITION = "_velaOrderPosition";
const VELA_ORDER_CHAIN = "_velaOrderChain";
const VELA_ORDER_AMOUNT = "_velaOrderAmount";
const VELA_ORDER_SLIPPAGE = "_velaOrderSlippage";
const VELA_ORDER_LIMIT_PRICE = "_velaOrderLimitPrice";
const VELA_ORDER_STOP_PRICE = "_velaOrderStopPrice";
const VELA_TAKE_PROFIT_TOGGLE = "_velaOrderTakeProfitToggle";
const VELA_TAKE_PROFIT_VALUE = "_velaOrderTakeProfitValue";
const VELA_STOP_LOSS_TOGGLE = "_velaOrderStopLossToggle";
const VELA_STOP_LOSS_VALUE = "_velaOrderStopLossValue";
const VELA_STOP_LOSS_MESSAGE_ID = "_velaOrderStopLoss_messageId";
const VELA_PROFIT_VALUE_MESSAGE_ID = "_velaOrderTakeProfitValue_messageId";
const VELA_ASSET_MESSAGE_ID = "_velaAssetId_messageId";
const VELA_ORDER_AMOUNT_MESSAGE_ID = "_velaOrderAmount_messageId";
const VELA_ORDER_SLIPPAGE_MESSAGE_ID = "_velaOrderSlippage_messageId";
const VELA_LIMIT_PRICE_MESSAGE_ID = "_velaOrderLimitPrice_messageId";
const VELA_STOP_PRICE_MESSAGE_ID = "_velaOrderStopPrice_messageId";

const VELA_COLLATERAL_PROMPT_MESSAGE =
  "Enter the amount of collateral you would like to set! (Minimum: 20)";
const VELA_AMOUNT_PROMPT_MESSAGE =
  "Enter the amount you would like to place in your order";
const VELA_SLIPPAGE_PROMPT_MESSAGE = "Enter the maximum slippage you want";
const VELA_LIMIT_PRICE_PROMPT_MESSAGE = "Enter the limit price";
const VELA_STOP_PRICE_PROMPT_MESSAGE = "Enter the stop price";
const VELA_TAKE_PROFIT_PROMPT_MESSAGE = "Enter price to take profit";
const VELA_STOP_LOSS_PROMPT_MESSAGE = "Enter price to stop loss";
const VELA_UPDATE_KEY_PROMPT_MESSAGE = "Update Vela API Key And ID";
const VELA_LIST_PROMPT_MESSAGE = "list of Vela asset pairs"

const VELA_SUPPORTED_CHAINS = [
  {
    chain_name: "Arbitrum",
    chain_id: 42161,
    chain_scanner: "https://arbiscan.io",
  },
  {
    chain_name: "Base",
    chain_id: 8453,
    chain_scanner: "https://basescan.org",
  },
];

module.exports = {
  VELA_TRADEBOT_URL_EXECUTE,
  VELA_TRADEBOT_URL,
  VELA_COLLATERAL_PROMPT_MESSAGE,
  VELA_AMOUNT_PROMPT_MESSAGE,
  VELA_SLIPPAGE_PROMPT_MESSAGE,
  VELA_LIMIT_PRICE_PROMPT_MESSAGE,
  VELA_STOP_PRICE_PROMPT_MESSAGE,
  VELA_SUPPORTED_CHAINS,
  VELA_TRADEBOT_API_DOCS,
  VELA_TAKE_PROFIT_PROMPT_MESSAGE,
  VELA_STOP_LOSS_PROMPT_MESSAGE,
  VELA_UPDATE_KEY_PROMPT_MESSAGE,
  VELA_APP_WITH_REFERRAL_LINK,
  VELA_LONG_CALLBACK_DATA,
  VELA_SHORT_CALLBACK_DATA,
  VELA_SELECT_TOKEN_ID_CALLBACK,
  VELA_ORDER_COLLATERAL_AMOUNT_CALLBACK,
  VELA_ORDER_AMOUNT_CALLBACK,
  VELA_ORDER_SLIPPAGE_CALLBACK,
  VELA_LIMIT_PRICE_CALLBACK,
  VELA_STOP_PRICE_CALLBACK,
  VELA_TAKE_PROFIT_TOGGLE_CALLBACK,
  VELA_STOP_LOSS_TOGGLE_CALLBACK,
  VELA_TAKE_PROFIT_VALUE_CALLBACK,
  VELA_STOP_LOSS_VALUE_CALLBACK,
  VELA_PLACE_ORDER_CALLBACK,
  VELA_ORDER_COLLATERAL_ID,
  VELA_ORDER_COLLATERAL_MESSAGE_ID,
  VELA_ASSET_ID,
  VELA_ORDER_IS_LONG,
  VELA_ORDER_POSITION,
  VELA_ORDER_CHAIN,
  VELA_ORDER_AMOUNT,
  VELA_ORDER_SLIPPAGE,
  VELA_ORDER_LIMIT_PRICE,
  VELA_ORDER_STOP_PRICE,
  VELA_TAKE_PROFIT_TOGGLE,
  VELA_TAKE_PROFIT_VALUE,
  VELA_STOP_LOSS_TOGGLE,
  VELA_STOP_LOSS_VALUE,
  VELA_ORDER_POSITION_CALLBACK,
  VELA_ORDER_SET_CHAIN_CALLBACK,
  VELA_STOP_LOSS_MESSAGE_ID,
  VELA_PROFIT_VALUE_MESSAGE_ID,
  VELA_ASSET_MESSAGE_ID,
  VELA_ORDER_AMOUNT_MESSAGE_ID,
  VELA_ORDER_SLIPPAGE_MESSAGE_ID,
  VELA_LIMIT_PRICE_MESSAGE_ID,
  VELA_STOP_PRICE_MESSAGE_ID,
  VELA_LIST_PROMPT_MESSAGE
};
