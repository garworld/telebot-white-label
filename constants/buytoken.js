const MENU_KEYBOARD_CALLBACK_DATA = "!menu";
const BACK_KEYBOARD_CALLBACK_DATA = "!back";
const ACTION_WALLET_CALLBACK_DATA = "!actionwallet";
const CHAIN_USED = "_chain";
const WALLET_CALLBACKDATA = "!wallet";
const LAST_CHAT = "_lastchat";
const SELECT_CHAIN = "!selectchain";
const SETTING_CALLBACK = "!setting";
const CHECK_WALLET = "_checkwallet";
const POINT_CALLBACK = "!point";
const REFERRAL_CALLBACK = "!referral";

const BUY_TOKEN_CALLBACK_DATA = "!buy";
const BUY_CONTINUE_CALLBACK_DATA = "!continuebuy";
const BUY_CANCEL_CALLBACK_DATA = "!cancelbuy";

const BUY_MESSAGE_ID = "_buy-message";
const BUY_PROCESS_ID = "_buy-process";
const BUY_PROCESS_REPLY_MARKUP = "_buy-process-reply";
const BUY_OPTIONS_ID = "_buy-opts";
const BUY_SUMMARY_ID = "_buy-summary";
const BUY_TOKEN_ADDRESS = "_tokenaddressbuy";
const BUY_MESSAGE_MENU = "_buymsg";

const BUY_SELECTION_WALLET_INCLUDES = "!selection";
const BUY_SELECTION_WALLET_1 = "!selection1:buy";
const BUY_SELECTION_WALLET_2 = "!selection2:buy";
const BUY_SELECTION_WALLET_3 = "!selection3:buy";
const BUY_SELECTION_ETH_INCLUDES = "!ethselect";
const BUY_SELECTION_ETH_1 = "!ethselect1:buy";
const BUY_SELECTION_ETH_2 = "!ethselect2:buy";
const BUY_SELECTION_ETH_3 = "!ethselect3:buy";
const BUY_CUSTOM_AMOUNT_ETH = "!ethcustom:buy";
const BUY_ENTER_TOKEN_ADDRESS = "!tokenaddress:buy";
const BUY_REFERENCE = "!reference:buy";

const DEFAULT_SLIPPAGE_AMOUNT = "10%";
const SLIPPAGE_SELECTION_1 = "!slippageselectbuy1";
const SLIPPAGE_SELECTION_2 = "!slippageselectbuy2";
const SLIPPAGE_SELECTION_3 = "!slippageselectbuy3";
const SLIPPAGE_CUSTOM_AMOUNT = "!slippagecustombuy";
const SLIPPAGE_SELECT = "!slippageselectbuy";
const SLIPPAGE_OPTIONS = "_slippage-optsbuy";
const SLIPPAGE_CUSTOM = "_slippagecustombuy";
const SLIPPAGE_PROMPT = "wanted slippage";
const PRIVATE_TXN = "!private-toggler";
const PRIVATE_SELECT = "_is-private-tx";

const BUY_SELECT_TOKEN = "!tokenused";
const BUY_SELECT_NATIVE = "!tokenused:native";
const BUY_SELECT_USDT = "!tokenused:usdt";
const BUY_SELECT_USDC = "!tokenused:usdc";

module.exports = {
  BUY_TOKEN_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
  BACK_KEYBOARD_CALLBACK_DATA,
  BUY_CONTINUE_CALLBACK_DATA,
  BUY_CANCEL_CALLBACK_DATA,
  BUY_MESSAGE_ID,
  BUY_PROCESS_ID,
  BUY_PROCESS_REPLY_MARKUP,
  BUY_OPTIONS_ID,
  BUY_TOKEN_ADDRESS,
  BUY_MESSAGE_MENU,
  BUY_SUMMARY_ID,
  BUY_SELECTION_WALLET_INCLUDES,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECTION_ETH_INCLUDES,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  ACTION_WALLET_CALLBACK_DATA,
  CHAIN_USED,
  WALLET_CALLBACKDATA,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_SELECTION_3,
  SLIPPAGE_CUSTOM_AMOUNT,
  SLIPPAGE_SELECT,
  SLIPPAGE_OPTIONS,
  SLIPPAGE_CUSTOM,
  SLIPPAGE_PROMPT,
  LAST_CHAT,
  SELECT_CHAIN,
  SETTING_CALLBACK,
  CHECK_WALLET,
  PRIVATE_TXN,
  PRIVATE_SELECT,
  POINT_CALLBACK,
  REFERRAL_CALLBACK,
  BUY_SELECT_TOKEN,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
  BUY_REFERENCE,
};
