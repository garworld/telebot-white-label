require("dotenv").config();

const COINGECKO_API_URL = "https://pro-api.coingecko.com/api/v3/";

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const COINGECKO_CATEGORY_CALLBACK_DATA = "!categoryBuy";
const COINGECKO_CATEGORY_TOKENS_CALLBACK = "!tokens";
const COINGECKO_CATEGORY_BUY_CALLBACK = "!coingeckoBuyCategoryTokens";

const COINGECKO_SELECT_CATEGORY_CALLBACK = "!categoryselection";
const COINGECKO_SELECTION_WALLET_INCLUDES = "!choose";
const COINGECKO_SELECTION_WALLET_1 = "!choose1:buy";
const COINGECKO_SELECTION_WALLET_2 = "!choose2:buy";
const COINGECKO_SELECTION_WALLET_3 = "!choose3:buy";
const COINGECKO_SELECTION_ETH_INCLUDES = "!ethchoose";
const COINGECKO_SELECTION_ETH_1 = "!ethchoose1:category";
const COINGECKO_SELECTION_ETH_2 = "!ethchoose2:category";
const COINGECKO_SELECTION_ETH_3 = "!ethchoose3:category";
const COINGECKO_CUSTOM_AMOUNT_ETH = "!ethcustom:category";
const COINGECKO_ENTER_TOKEN_ADDRESS = "!sendBuyTx:category";
const COINGECKO_CONTINUE_CALLBACK_DATA = "!continueCategoryBuy";

const COINGECKO_CATEGORY_UPDATE_AMOUNT = "!updateAmountCategoryTokens";
const COINGECKO_CATEGORY_UPDATE_SLIPPAGE = "!updateSlippageCategoryTokens";
const COINGECKO_CATEGORY_UPDATE_NETWORK = "!updateNetworkCategoryTokens";
const COINGECKO_CATEGORY_UPDATE_WALLET = "!updateWalletCategoryTokens";

const COINGECKO_AMOUNT_PROMPT_MESSAGE =
  "Enter the total amount you would like to spend to buy the top 5 tokens in this category";
const COINGECKO_SLIPPAGE_PROMPT_MESSAGE =
  "Enter the slippage you would allow for these buys";

const COINGECKO_PLATFORM_ETHEREUM = "ethereum";
const COINGECKO_PLATFORM_ARBITRUM = "arbitrum-one";

const COINGECKO_SAVED_CATEGORY_TOKENS = "_coingecko_saved_tokens";
const COINGECKO_MENU_MESSAGE_ID = "_coingecko_menu";
const COINGECKO_AMOUNT = "_coingecko_amount";
const COINGECKO_SLIPPAGE = "_coingecko_slippage";
const COINGECKO_NETWORK = "_coingecko_network";
const COINGECKO_WALLET_INDEX = "_coingecko_wallet_index";
const COINGECKO_CATEGORY_NAME = "_coingecko_category_name";
const COINGECKO_CATEGORY_ID = "_coingecko_category_id";
const COINGECKO_UPDATE_AMOUNT = "_coingecko_update_amount";
const COINGECKO_UPDATE_SLIPPAGE = "_coingecko_update_slippage";
const COINGECKO_ADDRESS_TOKENS = "_coingecko_tokens";

const numTokens = 10;

const COINGECKO_SUPPORTED_CHAINS = {
  0: {
    chain_name: "Ethereum",
    chain_id: 1,
    chain_scanner: "https://etherscan.io",
  },
  1: {
    chain_name: "Arbitrum",
    chain_id: 42161,
    chain_scanner: "https://arbiscan.io",
  },
  2: {
    chain_name: "Avalanche C-Chain",
    chain_id: 43114,
    chain_scanner: "https://snowtrace.io",
  },
  3: {
    chain_name: "Metis Andromeda",
    chain_id: 1088,
    chain_scanner: "https://explorer.metis.io",
  },
  4: {
    chain_name: "Solana Mainnet",
    chain_id: 1399811149,
    chain_scanner: "https://solscan.io",
  },
  5: {
    chain_name: "Base Mainnet",
    chain_id: 8453,
    chain_scanner: "https://basescan.org",
  },
};

const COINGECKO_CATEGORY_NAME_ARBITRUM = "Arbitrum Ecosystem";
const COINGECKO_CATEGORY_ID_ARBITRUM = "arbitrum-ecosystem";

const DEFAULT_SLIPPAGE_AMOUNT = "10%";
const SLIPPAGE_SELECTION_1 = "!slippageselectcategory1";
const SLIPPAGE_SELECTION_2 = "!slippageselectcategory2";
const SLIPPAGE_SELECTION_3 = "!slippageselectcategory3";
const SLIPPAGE_CUSTOM_AMOUNT = "!slippagecustomcategory";
const SLIPPAGE_SELECT = "!slippageselectcategory";
const SLIPPAGE_OPTIONS = "_slippage-optscategory";
const SLIPPAGE_CUSTOM = "_slippagecustomcategory";
const SLIPPAGE_PROMPT = "default slippage";

const COINGECKO_BUY_SUMMARY = "_coingecko_buy_summary";

const COINGECKO_CATEGORY_NAME_AVALANCHE = "Avalanche Ecosystem";
const COINGECKO_CATEGORY_ID_AVALANCHE = "avalanche-ecosystem";
const COINGECKO_PLATFORM_AVALANCHE = "avalanche";

const CATEGORY_SELECT_TOKEN = "!coinused";
const CATEGORY_SELECT_NATIVE = "!coinused:native";
const CATEGORY_SELECT_USDT = "!coinused:usdt";
const CATEGORY_SELECT_USDC = "!coinused:usdc";

const COINGECKO_CATEGORY_NAME_METIS = "Metis Ecosystem";
const COINGECKO_CATEGORY_ID_METIS = "metis-ecosystem";
const COINGECKO_PLATFORM_METIS = "metis-andromeda";

const COINGECKO_CATEGORY_NAME_SOLANA = "Solana Ecosystem";
const COINGECKO_CATEGORY_ID_SOLANA = "solana-ecosystem";
const COINGECKO_PLATFORM_SOLANA = "solana";

const COINGECKO_CATEGORY_NAME_BASE = "Base Ecosystem";
const COINGECKO_CATEGORY_ID_BASE = "base-ecosystem";
const COINGECKO_PLATFORM_BASE = "base";

const networkOptions = [
  {
    text: COINGECKO_PLATFORM_ETHEREUM,
    callback_data:
      COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_ETHEREUM,
  },
  {
    text: COINGECKO_PLATFORM_ARBITRUM,
    callback_data:
      COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_ARBITRUM,
  },
  {
    text: COINGECKO_PLATFORM_AVALANCHE,
    callback_data:
      COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_AVALANCHE,
  },
  {
    text: COINGECKO_PLATFORM_METIS,
    callback_data: COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_METIS,
  },
  {
    text: COINGECKO_PLATFORM_SOLANA,
    callback_data:
      COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_SOLANA,
  },
  {
    text: COINGECKO_PLATFORM_BASE,
    callback_data: COINGECKO_CATEGORY_UPDATE_NETWORK + COINGECKO_PLATFORM_BASE,
  },
];

module.exports = {
  COINGECKO_API_URL,
  COINGECKO_API_KEY,
  COINGECKO_CATEGORY_CALLBACK_DATA,
  COINGECKO_CATEGORY_TOKENS_CALLBACK,
  COINGECKO_CATEGORY_BUY_CALLBACK,
  COINGECKO_CATEGORY_UPDATE_AMOUNT,
  COINGECKO_CATEGORY_UPDATE_NETWORK,
  COINGECKO_CATEGORY_UPDATE_SLIPPAGE,
  COINGECKO_CATEGORY_UPDATE_WALLET,
  COINGECKO_AMOUNT_PROMPT_MESSAGE,
  COINGECKO_SLIPPAGE_PROMPT_MESSAGE,
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_PLATFORM_ARBITRUM,
  numTokens,
  networkOptions,
  COINGECKO_SUPPORTED_CHAINS,
  COINGECKO_SAVED_CATEGORY_TOKENS,
  COINGECKO_MENU_MESSAGE_ID,
  COINGECKO_AMOUNT,
  COINGECKO_SLIPPAGE,
  COINGECKO_NETWORK,
  COINGECKO_WALLET_INDEX,
  COINGECKO_CATEGORY_NAME,
  COINGECKO_CATEGORY_ID,
  COINGECKO_UPDATE_AMOUNT,
  COINGECKO_UPDATE_SLIPPAGE,
  COINGECKO_ADDRESS_TOKENS,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  COINGECKO_SELECTION_WALLET_INCLUDES,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
  COINGECKO_SELECTION_ETH_INCLUDES,
  COINGECKO_SELECTION_ETH_1,
  COINGECKO_SELECTION_ETH_2,
  COINGECKO_SELECTION_ETH_3,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  COINGECKO_ENTER_TOKEN_ADDRESS,
  COINGECKO_CONTINUE_CALLBACK_DATA,
  COINGECKO_CATEGORY_NAME_ARBITRUM,
  COINGECKO_CATEGORY_ID_ARBITRUM,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_SELECTION_3,
  SLIPPAGE_CUSTOM,
  SLIPPAGE_OPTIONS,
  SLIPPAGE_PROMPT,
  SLIPPAGE_SELECT,
  SLIPPAGE_CUSTOM_AMOUNT,
  COINGECKO_BUY_SUMMARY,
  COINGECKO_PLATFORM_AVALANCHE,
  COINGECKO_CATEGORY_NAME_AVALANCHE,
  COINGECKO_CATEGORY_ID_AVALANCHE,
  CATEGORY_SELECT_TOKEN,
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_CATEGORY_NAME_METIS,
  COINGECKO_CATEGORY_ID_METIS,
  COINGECKO_PLATFORM_SOLANA,
  COINGECKO_CATEGORY_NAME_SOLANA,
  COINGECKO_CATEGORY_ID_SOLANA,
  COINGECKO_PLATFORM_BASE,
  COINGECKO_CATEGORY_NAME_BASE,
  COINGECKO_CATEGORY_ID_BASE,
};
