// dotenv
require("dotenv").config();

// node_modules
const fastifyCors = require("@fastify/cors");
const fastifyFormbody = require("@fastify/formbody");
const fastifyHelmet = require("@fastify/helmet");
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { wallet_number } = require("@prisma/client");
const { CronJob } = require("cron");
const { randomUUID } = require("crypto");
const ethers = require("ethers");
const fastify = require("fastify");
const Moralis = require("moralis").default;
const { dispatch, spawnStateless, start } = require("nact");
const TelegramBot = require("node-telegram-bot-api");
const Queue = require("yocto-queue");

// config logger
const loggerConfig = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:standard",
      },
    },
    level: "debug",
  },
  production: true,
  testing: false,
};

// custom modules
const {
  botdb,
  getChains,
  getWallet,
  saveVelaApiKey,
  getVelaApiKey,
  saveCoingeckoTokens,
  getCoingeckoTokens,
  saveCoingeckoCategories,
  postReference,
  getClientByApiKey,
  getTokenAddress,
} = require("./databases");
const {
  buyTokenUseETH1Inch,
  ethUsd,
  moralisDetails,
  gasEstimation,
  logger,
  redis,
  transferETH,
  transferToken,
  tokenErrorHandler,
  openOceanSwapQuote,
  jupiterSwapQuote,
} = require("./helpers");
const {
  begin,
  summary,
  errorMessageHandler,
  replyMessage,
  callback,
} = require("./telefunction");
const { coingeckoApis } = require("./apis");
const getCoingeckoCategories = require("./databases/getCoingeckoCategories");
const {
  COINGECKO_AMOUNT_PROMPT_MESSAGE,
  COINGECKO_SLIPPAGE_PROMPT_MESSAGE,
  COINGECKO_CATEGORY_CALLBACK_DATA,
  COINGECKO_CATEGORY_TOKENS_CALLBACK,
  COINGECKO_CATEGORY_UPDATE_AMOUNT,
  COINGECKO_CATEGORY_UPDATE_SLIPPAGE,
  COINGECKO_CATEGORY_UPDATE_NETWORK,
  COINGECKO_CATEGORY_UPDATE_WALLET,
  COINGECKO_CATEGORY_BUY_CALLBACK,
  COINGECKO_SELECTION_ETH_INCLUDES,
  COINGECKO_SELECTION_WALLET_INCLUDES,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  COINGECKO_ENTER_TOKEN_ADDRESS,
  COINGECKO_CONTINUE_CALLBACK_DATA,
  COINGECKO_CATEGORY_NAME,
  COINGECKO_CATEGORY_ID,
  COINGECKO_PLATFORM_ARBITRUM,
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_ADDRESS_TOKENS,
  COINGECKO_SAVED_CATEGORY_TOKENS,
  COINGECKO_MENU_MESSAGE_ID,
  COINGECKO_CATEGORY_NAME_ARBITRUM,
  COINGECKO_CATEGORY_ID_ARBITRUM,
  COINGECKO_PLATFORM_AVALANCHE,
  CATEGORY_SELECT_TOKEN,
  COINGECKO_CATEGORY_NAME_METIS,
  COINGECKO_CATEGORY_ID_METIS,
  COINGECKO_CATEGORY_NAME_AVALANCHE,
  COINGECKO_CATEGORY_ID_AVALANCHE,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_PLATFORM_SOLANA,
  COINGECKO_CATEGORY_NAME_SOLANA,
  COINGECKO_CATEGORY_ID_SOLANA,
  COINGECKO_CATEGORY_NAME_BASE,
  COINGECKO_CATEGORY_ID_BASE,
  COINGECKO_PLATFORM_BASE,
} = require("./constants/coingecko");
const {
  BUY_TOKEN_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
  BACK_KEYBOARD_CALLBACK_DATA,
  BUY_CONTINUE_CALLBACK_DATA,
  BUY_CANCEL_CALLBACK_DATA,
  BUY_MESSAGE_ID,
  BUY_PROCESS_ID,
  BUY_PROCESS_REPLY_MARKUP,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  BUY_SELECTION_ETH_INCLUDES,
  BUY_SELECTION_WALLET_INCLUDES,
  ACTION_WALLET_CALLBACK_DATA,
  CHAIN_USED,
  WALLET_CALLBACKDATA,
  SLIPPAGE_SELECT,
  SLIPPAGE_CUSTOM_AMOUNT,
  SLIPPAGE_PROMPT,
  LAST_CHAT,
  SELECT_CHAIN,
  SETTING_CALLBACK,
  CHECK_WALLET,
  PRIVATE_TXN,
  POINT_CALLBACK,
  REFERRAL_CALLBACK,
  BUY_SELECT_TOKEN,
  BUY_OPTIONS_ID,
  BUY_REFERENCE,
  BUY_SUMMARY_ID,
  PRIVATE_SELECT,
} = require("./constants/buytoken");
const {
  SELL_TOKEN_CALLBACK_DATA,
  SELL_PERCENT_CUSTOM_AMOUNT,
  SELL_SELECT_TOKENS,
  SELL_PERCENT_SELECT_INCLUDES,
  SELL_SELECT_CURRENCY,
} = require("./constants/selltoken");
const {
  TRANSFER_CUSTOM_AMOUNT_ETH,
  TRANSFER_DESTINATION_WALLET_ETH_CALLBACK,
  TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK,
  TRANSFER_PERCENT_ETH_INCLUDES,
  TRANSFER_AMOUNT_ETH_INCLUDES,
  TRANSFER_CONTINUE_ETH,
  TRANSFER_CANCEL_ETH,
} = require("./constants/transfertoken");
const {
  VELA_COLLATERAL_PROMPT_MESSAGE,
  VELA_AMOUNT_PROMPT_MESSAGE,
  VELA_SLIPPAGE_PROMPT_MESSAGE,
  VELA_LIMIT_PRICE_PROMPT_MESSAGE,
  VELA_STOP_PRICE_PROMPT_MESSAGE,
  VELA_SUPPORTED_CHAINS,
  VELA_TRADEBOT_API_DOCS,
  VELA_TAKE_PROFIT_PROMPT_MESSAGE,
  VELA_STOP_LOSS_PROMPT_MESSAGE,
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
  VELA_UPDATE_KEY_PROMPT_MESSAGE,
  VELA_LIST_PROMPT_MESSAGE,
} = require("./constants/vela");
const { selltoken, coingecko } = require("./constants");
const { formatNumber } = require("./helpers/abbreviateNumber");
const { avaUsd, oneInchSwapQuote } = require("./helpers/tokenPrice");
const { DATA_CHAIN_LIST } = require("./constants/chains");
const { getCoinUsdPrice, getCoinInfoByAddress } = require("./apis/coingecko");
// const buyTokenHera = require("./helpers/buyHera");
const buyOpenOcean = require("./helpers/buy-openOcean");
const buyTokenJupiter = require("./helpers/solana/buy-Jupiter");
const saveTokenPrice = require("./databases/saveTokenPrice");
const saveCoingeckoTokensImg = require("./databases/saveCoingeckoTokensImg");
const saveTokenCategories = require("./databases/saveTokenCategories");
const getAutoBuy = require("./databases/getAutoBuy");
const dexGetUsdPrice = require("./helpers/dexScreener");
const { default: axios } = require("axios");
const app = fastify({
  logger: loggerConfig[process.env.APP_ENV] ?? true,
});

// system actor initializing
const system = start();
const actorDelay = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));
const actorReset = async (_msg, _error, ctx) => {
  await actorDelay(500);
  return ctx.reset;
};

// variable initializing
let address_list = {};
let tbot = null;
let token_list = {};

// copy trade bot sender queue
const telebotQueue = new Queue();

// gas tracker
const gasTracker = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      //
      const gasPrice0 = await gasEstimation(chains[0].rpc_provider);
      const gasPrice1 = await gasEstimation(chains[1].rpc_provider);
      const gasPrice2 = await gasEstimation(chains[2].rpc_provider);
      const gasPrice3 = await gasEstimation(chains[3].rpc_provider);
      const gasPrice4 = await gasEstimation(
        // "https://neon-proxy-mainnet.solana.p2p.org",
        chains[4].rpc_provider,
        chains[4].chain_id
      );
      const gasPrice5 = await gasEstimation(chains[5].rpc_provider);

      //
      await redis.SET("gas:0", gasPrice0);
      await redis.SET("gas:1", gasPrice1);
      await redis.SET("gas:2", gasPrice2);
      await redis.SET("gas:3", gasPrice3);
      await redis.SET("gas:4", gasPrice4);
      await redis.SET("gas:5", gasPrice5);
    } catch (err) {
      app.log.error("GAS TRACKER ERROR: " + err.message);
    }
  },
  "gasTracker"
);

// chains getter
const chainsGetter = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      await getChains({ redis });
      //
      dispatch(
        gasTracker,
        {},
        {
          onCrash: actorReset,
        }
      );
    } catch (err) {
      app.log.error("CHAINS GETTER ERROR: " + err.message);
    }
  },
  "chainsGetter"
);

// eth usd checker
const ethUsdChecker = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      //
      const usdPrice = await ethUsd();
      const avaUsdPrice = await avaUsd();
      const metisUsdPrice = await getCoinUsdPrice(
        3,
        "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
      );
      const solanaUsdPrice = await getCoinUsdPrice(
        4,
        "So11111111111111111111111111111111111111112"
      );
      //
      await redis.SET("ethusd", usdPrice);
      await redis.SET("avausd", avaUsdPrice);
      await redis.SET("metisusd", metisUsdPrice);
      await redis.SET("solusd", solanaUsdPrice);
    } catch (err) {
      app.log.error("ETH USD ERROR: " + err.message);
    }
  },
  "ethUsdChecker"
);

// message editor
const messageEditor = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      // console.log("MSG EDITOR MSG: ", msg);

      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      //
      const chainused = Number(await redis.GET(msg.chat_id + CHAIN_USED)) || 0;

      let nativeToken = "ETH";
      switch (chainused) {
        case 2:
          nativeToken = "AVAX";
          break;
        case 3:
          nativeToken = "METIS";
          break;
        case 4:
          nativeToken = "SOL";
          break;
      }
      const buy_options = JSON.parse(
        await redis.GET(msg.chat_id + BUY_OPTIONS_ID)
      );
      let tokenUsed = nativeToken;
      if (
        buy_options?.reply_markup.inline_keyboard[4][1].text.includes("\u2705")
      ) {
        tokenUsed = "USDT";
      }
      if (
        buy_options?.reply_markup.inline_keyboard[4][2].text.includes("\u2705")
      ) {
        tokenUsed = "USDC";
      }

      //
      const messageToDelete = await redis.GET(
        msg.chat_id + BUY_PROCESS_ID + "_" + msg.index
      );
      const replyMarkup = await redis.GET(
        msg.chat_id + BUY_PROCESS_REPLY_MARKUP + "_" + msg.index
      );

      //
      let message = await redis.GET(
        msg.chat_id + BUY_MESSAGE_ID + "_" + msg.index
      );

      // console.log("MSG EDITOR MESSAGE, TO DELETE: ", {
      //   message,
      //   messageToDelete,
      // });

      //
      if (message) {
        //
        if (msg.res === null) {
          // console.log("EDITED MESSAGE: ", message.replace(
          //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`,
          //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDD34 <strong>Error:</strong> Please try again later.\n\n`
          // ));
          message = message.replace(
            `[<a href="${chains[chainused].chain_scanner}/address/${
              msg.wallet_address
            }">Wallet-${
              msg.index + 1
            }</a>]\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`,
            `[<a href="${chains[chainused].chain_scanner}/address/${
              msg.wallet_address
            }">Wallet-${
              msg.index + 1
            }</a>]\n\uD83D\uDD34 <strong>Error:</strong> Please try again later.\n\n`
          );
          await redis.SET(msg.chat_id + BUY_MESSAGE_ID, message);
        } else {
          if (msg.res.hash) {
            // console.log("EDITED MESSAGE: ", message.replace(
            //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`,
            //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDFE2 <strong>Success</strong>\n<a href="${chains[chainused].chain_scanner}/tx/${msg.res.hash}">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20swapped%20${msg.amount}%20ETH%20for%20${msg.received}%20${msg.symbol}%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>\n\n`
            // ));
            message = message.replace(
              `[<a href="${chains[chainused].chain_scanner}/address/${
                msg.wallet_address
              }">Wallet-${
                msg.index + 1
              }</a>]\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`,
              `[<a href="${chains[chainused].chain_scanner}/address/${
                msg.wallet_address
              }">Wallet-${
                msg.index + 1
              }</a>]\n\uD83D\uDFE2 <strong>Success</strong>\n<a href="${
                chains[chainused].chain_scanner
              }/tx/${
                msg.res.hash
              }">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20swapped%20${
                msg.amount
              }%20${tokenUsed}%20for%20${msg.received}%20${
                msg.symbol
              }%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>\n\n`
            );
            await redis.SET(msg.chat_id + BUY_MESSAGE_ID, message);
          } else {
            // console.log({ error: msg.res.error });
            // console.log("EDITED MESSAGE: ", message.replace(
            //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`,
            //   `[<a href="${chains[chainused].chain_scanner}/address/${msg.wallet_address}">Wallet-${msg.index + 1}</a>]\n\uD83D\uDD34 <strong>Error:</strong> ${msg.res.error.message}.\n\n`
            // ));
            if (
              msg.res.error === "Insufficient funds" ||
              msg.res.error.includes("Not enough") ||
              (typeof msg.res.error === "Object" &&
                msg.res.error.message &&
                msg.res.error.message.includes("insufficient funds"))
            ) {
              message = `[<a href="${chains[chainused].chain_scanner}/address/${
                msg.wallet_address
              }">Wallet-${
                msg.index + 1
              }</a>]\n\uD83D\uDD34 <strong>Error:</strong> Insufficient funds.\n\nPlease deposit sufficient funds into your wallet.`;
            } else {
              message = `[<a href="${chains[chainused].chain_scanner}/address/${
                msg.wallet_address
              }">Wallet-${
                msg.index + 1
              }</a>]\n\uD83D\uDD34 <strong>Error:</strong> ${
                msg.res.error
              }.\n\n`;
            }
            await redis.SET(msg.chat_id + BUY_MESSAGE_ID, message);
          }
        }

        // console.log({ message });

        msg.bot.editMessageText(message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          chat_id: msg.chat_id,
          message_id: messageToDelete,
          reply_markup: JSON.parse(replyMarkup),
        });

        // //
        // messageToDelete
        //   ? msg.bot.deleteMessage(msg.chat_id, Number(messageToDelete))
        //   : null;
        // const buyProcessMsg = await msg.bot.sendMessage(msg.chat_id, message, {
        //   parse_mode: "HTML",
        //   disable_web_page_preview: true,
        //   reply_markup: {
        //     inline_keyboard: [
        //       [
        //         {
        //           text: "\uD83D\uDED2 Buy More",
        //           callback_data: BUY_TOKEN_CALLBACK_DATA,
        //         },
        //         {
        //           text: "\u2261 Menu",
        //           callback_data: MENU_KEYBOARD_CALLBACK_DATA,
        //         },
        //       ],
        //     ],
        //   },
        // });

        // //
        // await redis.SET(msg.chat_id + BUY_PROCESS_ID, buyProcessMsg.message_id);
      }
    } catch (err) {
      //
      app.log.error("MESSAGE EDITOR ERROR: " + err.message);
    }
  },
  "messageEditor"
);

// buy executor
const buyExecutor = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      let res;
      switch (msg.chainused) {
        case 3:
          // res = await buyTokenHera(
          //   msg.chainused,
          //   msg.walletPk,
          //   msg.buySummary.token_address,
          //   msg.buySummary.amount,
          //   msg.buySummary.slippage.toString(),
          //   msg.isPrivate,
          //   msg.msg,
          //   msg.walletUsed,
          //   msg.chains,
          //   msg.redis,
          //   msg.buyTokenAddress
          // );
          res = await buyOpenOcean(
            msg.chainused,
            msg.walletPk,
            msg.buySummary.token_address,
            msg.buySummary.amount,
            msg.buySummary.slippage.toString(),
            msg.isPrivate,
            msg.msg,
            msg.walletUsed,
            msg.chains,
            msg.redis,
            msg.buyTokenAddress
          );
          break;
        case 4:
          res = await buyTokenJupiter(
            msg.chainused,
            msg.walletPk,
            msg.buySummary.token_address,
            msg.buySummary.amount,
            msg.buySummary.slippage.toString(),
            msg.isPrivate,
            msg.msg,
            msg.walletUsed,
            msg.chains,
            msg.redis,
            msg.buyTokenAddress
          );
          break;
        default:
          res = await buyTokenUseETH1Inch(
            msg.chainused,
            msg.walletPk,
            msg.buySummary.token_address,
            msg.buySummary.amount,
            msg.buySummary.slippage.toString(),
            msg.isPrivate,
            msg.msg,
            msg.walletUsed,
            msg.chains,
            msg.redis,
            msg.buyTokenAddress
          );
      }

      dispatch(
        messageEditor,
        {
          res,
          wallet_address: msg.walletAddress,
          index: msg.index,
          bot: msg.bot,
          amount: msg.buySummary.amount,
          received: msg.buySummary.received,
          symbol: msg.buySummary.token_symbol,
          chat_id: msg.msg.chat.id,
        },
        {
          onCrash: actorReset,
        }
      );
    } catch (err) {
      //
      app.log.error("BUY EXECUTOR ERROR: " + err.message);
    }
  },
  "buyExecutor"
);

// copy trade bearer of good news
const goodNewsBearer = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      if (tbot) {
        //
        // console.log("NEWS BEARER DATA: ", msg.data);

        //
        let message = "";

        //
        const rawMessage = JSON.parse(msg.data);

        // get chains
        // const chainsCache = await redis.GET("chainsCache");
        // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
        const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

        // chat id as identifier for bot user
        const chatid = rawMessage.data.chatid;
        const walletNumber = rawMessage.data.wallet.number;
        const walletAddress = rawMessage.data.wallet.address;
        const activity = rawMessage.data.eventActivity;
        const amount = rawMessage.data.amount;

        if (rawMessage.data.sniping) {
          //
          const snipedToken = rawMessage.data.snipedToken;

          // format token sniped
          const formatSnipedToken = (address) => {
            const visible = 4;
            const startDigit = address.slice(0, visible);
            const endDigit = address.slice(-visible);
            const formattedAddress = `${startDigit}....${endDigit}`;
            return formattedAddress;
          };
          const formatSniped = formatSnipedToken(snipedToken);

          //
          if (rawMessage.data.txResult.hash) {
            //
            message += `\uD83D\uDFE2 <strong>Success Sniping Token:</strong>\n${snipedToken}\n\n`;

            //
            message += `<a href="${
              chains[chains.findIndex((x) => x.chain_id === rawMessage.chain)]
                .chain_scanner
            }/tx/${
              rawMessage.data.txResult.hash
            }">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20copied%20a%20trade%20from%20${formatSniped}%20and%20bought%20${formatNumber(
              amount
            )}%20${
              rawMessage.data.swapQuote.toToken.symbol
            }%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>`;
          } else {
            //
            message += `\uD83D\uDD34 <strong>Error: </strong>${rawMessage.data.txResult.error}\n\n`;
            message += `<strong>Failed Sniping Token:</strong>\n${snipedToken}`;
          }
        } else {
          //
          const copiedAddress = rawMessage.data.copiedAddress;

          // format copied address
          const formatCopiedAddress = (address) => {
            const visible = 4;
            const startDigit = address.slice(0, visible);
            const endDigit = address.slice(-visible);
            const formattedAddress = `${startDigit}....${endDigit}`;
            return formattedAddress;
          };
          const formatCopied = formatCopiedAddress(copiedAddress);

          //
          message = `Chain: ${
            chains[chains.findIndex((x) => x.chain_id === rawMessage.chain)]
              .text
          }\n----------------------------\n`;
          message += `[<a href="${
            chains[chains.findIndex((x) => x.chain_id === rawMessage.chain)]
              .chain_scanner
          }/address/${walletAddress}">Wallet-${walletNumber}</a>]\n`;

          //
          if (rawMessage.data.txResult.hash) {
            //
            message += `\uD83D\uDFE2 <strong>Success Copying Trade from:</strong>\n${copiedAddress}\n\n`;

            //
            switch (activity) {
              case "buy":
                //
                message += `<strong>Spent: </strong>${formatNumber(amount)} ${
                  rawMessage.data.swapQuote.fromToken.symbol
                }\n`;
                message += `<strong>Bought: </strong>${formatNumber(
                  ethers.utils.formatUnits(
                    rawMessage.data.swapQuote.toAmount,
                    rawMessage.data.swapQuote.toToken.decimals
                  )
                )} ${rawMessage.data.swapQuote.toToken.symbol}\n\n`;

                //
                break;
              case "sell":
                //
                message += `<strong>Sold: </strong>${formatNumber(amount)} ${
                  rawMessage.data.swapQuote.fromToken.symbol
                }\n`;
                message += `<strong>Received: </strong>${formatNumber(
                  ethers.utils.formatUnits(
                    rawMessage.data.swapQuote.toAmount,
                    rawMessage.data.swapQuote.toToken.decimals
                  )
                )} ${rawMessage.data.swapQuote.toToken.symbol}\n\n`;

                //
                break;
              default:
                //
                message += `<strong>Spent: </strong>${formatNumber(amount)} ${
                  rawMessage.data.swapQuote.fromToken.symbol
                }\n`;
                message += `<strong>Bought: </strong>${formatNumber(
                  ethers.utils.formatUnits(
                    rawMessage.data.swapQuote.toAmount,
                    rawMessage.data.swapQuote.toToken.decimals
                  )
                )} ${rawMessage.data.swapQuote.toToken.symbol}\n\n`;
            }

            //
            message += `<a href="${
              chains[chains.findIndex((x) => x.chain_id === rawMessage.chain)]
                .chain_scanner
            }/tx/${
              rawMessage.data.txResult.hash
            }">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20copied%20a%20trade%20from%20${formatCopied}%20and%20${
              activity === "buy" ? "bought" : "sold"
            }%20${formatNumber(amount)}%20${
              rawMessage.data.swapQuote.fromToken.symbol
            }%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>`;
          } else {
            //
            message += `\uD83D\uDD34 <strong>Error: </strong>${rawMessage.data.txResult.error}\n\n`;
            message += `<strong>Failed Copying Trade From: </strong>\n${copiedAddress}`;
          }
        }

        // bot send message
        tbot.sendMessage(chatid, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
      }
    } catch (err) {
      app.log.error("GOOD NEWS BEARER ERROR: " + err.message);
    }
  },
  "goodNewsBearer"
);

// copy trade manager the bearer of good news
const goodNewsManager = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      //
      const qSize = telebotQueue.size;
      let messengerSize = Number(process.env.MESSENGER_CAPACITY);

      //
      if (qSize > 0) {
        if (qSize < messengerSize) {
          messengerSize = qSize;
        }
        [...Array(messengerSize)].forEach((_) => {
          //
          dispatch(
            goodNewsBearer,
            {
              data: telebotQueue.dequeue(),
            },
            {
              onCrash: actorReset,
            }
          );
        });
      }
    } catch (err) {
      app.log.error("GOOD NEWS MANAGER ERROR: " + err.message);
    }
  },
  "goodNewsManager"
);

// bot
const onStart = async (bot) => {
  // get chains
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  //
  let timeouting = null;

  // on start
  bot.onText(/\/start/, async (msg) => {
    try {
      // handle begin message on bot
      // console.log("PARAMS: ", msg.text.split(" ")[1]);

      //
      // const sample = "buy_apikey_1399811149_0.001_USDT_10_CcEk8s8HDhvUMdr5EPfetCeLBv1Dh81z589NBrxGQ7Cn_101";

      const _ethusd = await redis.GET("ethusd");
      const _avaxusd = await redis.GET("avausd");
      const _metisusd = await redis.GET("metisusd");
      const _solusd = await redis.GET("solusd");

      //
      const params =
        (await redis.GET("deeplink_" + msg.text.split(" ")[1])) || null;
      await redis.DEL("deeplink_" + msg.text.split(" ")[1]);
      // let params = null;
      // if (msg.text.split(" ")[1] === "sample") params = sample;
      // console.log("PARAMS: ", params);

      //
      let referral___ = {
        action: null,
        from: {
          clientName: "",
          clientLink: "",
        },
        chain: 1,
        amount: 1000,
        unit: null,
        slippage: 10,
        address: "",
        wallet: [],
      };

      //
      const defaultValue = await getAutoBuy(msg.chat.id);

      //
      // referral___.unit = defaultValue.unit;
      referral___.slippage = defaultValue.slippage;

      // //
      // await callback.buyTokenHandler({ bot, redis, msg });

      //
      const checkWallet = await redis.GET(msg.chat.id + CHECK_WALLET);
      // console.log(!checkWallet);

      //
      if (params) {
        const theSplit = params.split("_");

        //
        referral___.action = theSplit[0] ? theSplit[0] : null;

        //
        const theClient = await getClientByApiKey(theSplit[1]);

        //
        referral___.from = theClient ? theClient : referral___.from;

        //
        referral___.chain = +theSplit[2] ? +theSplit[2] : referral___.chain;
        // referral___.amount = +theSplit[3] ? +theSplit[3] : referral___.amount;
        // referral___.slippage = +theSplit[5] ? +theSplit[5] : referral___.slippage;
        referral___.address = theSplit[6];

        //
        switch (referral___.chain) {
          case 1088:
            referral___.unit
              ? (referral___.unit = defaultValue.unit)
              : (referral___.unit = "METIS");
            referral___.unit === "METIS"
              ? (referral___.amount = defaultValue.amount / Number(_metisusd))
              : (referral___.amount = defaultValue.amount);
            break;
          case 43114:
            referral___.unit
              ? (referral___.unit = defaultValue.unit)
              : (referral___.unit = "AVAX");
            referral___.unit === "AVAX"
              ? (referral___.amount = defaultValue.amount / Number(_avaxusd))
              : (referral___.amount = defaultValue.amount);
            break;
          case 1399811149:
            referral___.unit
              ? (referral___.unit = defaultValue.unit)
              : (referral___.unit = "SOL");
            referral___.unit === "SOL"
              ? (referral___.amount = defaultValue.amount / Number(_solusd))
              : (referral___.amount = defaultValue.amount);
            break;
          default:
            referral___.unit
              ? (referral___.unit = defaultValue.unit)
              : (referral___.unit = "ETH");
            referral___.unit === "ETH"
              ? (referral___.amount = defaultValue.amount / Number(_ethusd))
              : (referral___.amount = defaultValue.amount);
        }

        //
        referral___.wallet = defaultValue.walletUsed;
        // referral___.wallet = [...theSplit[7]].map((x, idx) => {
        //   if (+x) {
        //     switch (idx) {
        //       case 1:
        //         return wallet_number.SECOND;
        //       case 2:
        //         return wallet_number.THIRD;
        //       default:
        //         return wallet_number.FIRST;
        //     }
        //   }
        //   return null;
        // })
        // .filter(y => y);
      }

      // console.log({
      //   referral___
      // });

      //
      if (!checkWallet) {
        if (msg.text.split(" ")[1]) {
          //
          await postReference(msg.chat.id, msg.text.split(" ")[1]);
        }

        let message = `Hello ${
          msg.chat.username || msg.chat.first_name
        }!👋\n\n`;
        message += "My name’s Bot, James Bot.\n";
        message +=
          "Click the button below and I’ll help create some new wallets for you. For first timers, it may take a while.";

        bot.sendMessage(msg.chat.id, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💼 Create Wallet",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
            ],
          },
        });
      } else {
        //
        if (referral___.action) {
          // go to buy execution
          if (referral___.action === "buy") {
            // await callback.buyTokenHandler({ bot, redis, msg, references: referral___ });
            // await callback.buyTokenHandler({ bot, redis, msg, references: referral___ });

            // wallets
            const wallets_to_use = referral___.wallet.map((x) => {
              switch (x) {
                case wallet_number.SECOND:
                  return 1;
                case wallet_number.THIRD:
                  return 2;
                default:
                  return 0;
              }
            });

            // private
            await redis.SET(
              msg.chat.id + PRIVATE_SELECT + "buy",
              defaultValue.isPrivate.toString()
            );

            //
            let response;
            // let tokenUsdPrice;

            //
            const chainused = chains.findIndex(
              (x) => Number(x.chain_id) === referral___.chain
            );
            await redis.SET(msg.chat.id + CHAIN_USED, chainused);

            //
            let nativeToken = "ETH";
            let addressToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

            //
            switch (chainused) {
              case 2:
                nativeToken = "AVAX";
                break;
              case 3:
                nativeToken = "METIS";
                addressToken = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
                break;
              case 4:
                nativeToken = "SOL";
                addressToken = "So11111111111111111111111111111111111111112";
                break;
            }

            //
            let tokenUsed = nativeToken;
            let unitName = "ether";

            //
            if (chainused === 4) {
              unitName = "gwei";
            }

            //
            if (referral___.unit === "USDT") {
              tokenUsed = "USDT";
              unitName = "mwei";
              addressToken = await getTokenAddress(chainused, tokenUsed);
            } else if (referral___.unit === "USDC") {
              tokenUsed = "USDC";
              unitName = "mwei";
              addressToken = await getTokenAddress(chainused, tokenUsed);
            }

            //
            try {
              //
              // let tokenUsdPrice = await dexGetUsdPrice(referral___.address);

              //
              switch (chainused) {
                case 3:
                  response = await getCoinInfoByAddress(
                    chainused,
                    referral___.address
                  );
                  break;
                case 4:
                  const getResp = await axios(
                    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      data: {
                        jsonrpc: "2.0",
                        id: randomUUID(),
                        method: "getAsset",
                        params: {
                          id: referral___.address,
                          displayOptions: {
                            showFungible: true, //return details about a fungible token
                          },
                        },
                      },
                    }
                  );

                  //
                  if (getResp?.data?.result) {
                    response = {
                      toToken: {
                        name: getResp.data.result.content.metadata.name,
                        symbol: getResp.data.result.content.metadata.symbol,
                        address: referral___.address,
                        decimals: getResp.data.result.token_info.decimals,
                      },
                    };
                  }

                  //
                  break;
                default:
                  response = await oneInchSwapQuote(
                    chainused,
                    addressToken,
                    referral___.address,
                    ethers.utils.parseUnits(
                      referral___.amount.toString(),
                      unitName
                    )
                  );
              }
            } catch (error) {
              response = null;
              const errMessage = error.message;
              console.error("TOKEN CHECKER ERROR: ", errMessage);
              await tokenErrorHandler(errMessage, bot, msg, redis);
            }

            if (response) {
              //
              await redis.SET(
                msg.chat.id + "_buywithaddress",
                JSON.stringify([addressToken, tokenUsed])
              );

              //
              let amountReceived;

              //
              try {
                switch (chainused) {
                  case 3:
                    //
                    const quoteResponse = await openOceanSwapQuote(
                      chainused,
                      addressToken,
                      referral___.address,
                      referral___.amount,
                      referral___.slippage
                    );

                    //
                    amountReceived = {
                      toAmount: quoteResponse.data.outAmount,
                    };
                    break;
                  case 4:
                    //
                    const amountInLamport = referral___.amount * 10 ** 9;

                    //
                    const jupiterResponse = await jupiterSwapQuote(
                      addressToken,
                      referral___.address,
                      amountInLamport,
                      referral___.slippage
                    );

                    //
                    let formattedOutAmount = jupiterResponse.outAmount;

                    //
                    if (
                      addressToken !==
                      "So11111111111111111111111111111111111111112"
                    ) {
                      formattedOutAmount =
                        Number(jupiterResponse.outAmount) / 1000;
                    }

                    //
                    amountReceived = {
                      toAmount: formattedOutAmount,
                    };
                    break;
                  default:
                    //
                    amountReceived = await oneInchSwapQuote(
                      chainused,
                      addressToken,
                      referral___.address,
                      ethers.utils.parseUnits(
                        referral___.amount.toString(),
                        unitName
                      )
                    );
                }
              } catch (e) {
                logger.error("ON REFERRAL BUY API QUOTE ERROR: " + e.message);
              }

              if (amountReceived) {
                //
                const received =
                  Number(amountReceived.toAmount) *
                  10 ** (-1 * Number(response.toToken.decimals));
                const amountReduction = received * 0.01;
                const actualReceived = formatNumber(received - amountReduction);

                //
                let amountIn = ethers.utils.parseUnits(
                  referral___.amount.toString(),
                  unitName
                );

                //
                const platformFee = amountIn.div(100);
                amountIn = amountIn.sub(platformFee);
                const amountFormat = ethers.utils.formatUnits(
                  amountIn,
                  unitName
                );

                //
                await redis.SET(
                  msg.chat.id + BUY_SUMMARY_ID,
                  JSON.stringify({
                    wallets: wallets_to_use,
                    amount: amountFormat,
                    slippage: referral___.slippage,
                    token_address: referral___.address,
                    token_symbol: response.toToken.symbol.toUpperCase(),
                    received: actualReceived,
                  })
                );
              }

              // console.log("BUY CONTINUE...");

              //
              await callback.buyContinueHandler({
                bot,
                redis,
                msg,
                getWallet,
                buyTokenUseETH1Inch,
                dispatch,
                // messageEditor,
                buyExecutor,
                actorReset,
                chains,
              });
            }
          }

          // got to another execution
        } else {
          //
          begin(bot, msg, redis);
        }
      }
    } catch (err) {
      //
      if (err?.message) {
        app.log.error("START ERROR: " + err?.message);
      } else {
        app.log.error("START ERROR: " + err);
      }

      errorMessageHandler(bot, msg);
    }
  });

  // on message - every message sent by user
  bot.on("message", async function (msg) {
    // debug logging
    // console.log("ON MESSAGE: ", msg);
    // app.log.debug("ON MESSAGE: " + JSON.stringify(msg));

    //
    let showVelaOrderOptions = false;

    const setShowVelaOrderOptions = (value) => {
      showVelaOrderOptions = value;
    };

    try {
      if (msg.reply_to_message) {
        switch (true) {
          case msg.reply_to_message.text.includes(
            "ERC-20 Token Contract Address"
          ):
            await replyMessage.erc20TokenBuyHandler({
              bot,
              redis,
              msg,
              logger,
              ethers,
              chains,
            }); // bbb.2 go here to cotinue buy/not
            break;
          case msg.reply_to_message.text.includes("Custom Amount for auto buy"):
            await replyMessage.amountAutoBuyHandler({ bot, redis, msg });
            break;
          case msg.reply_to_message.text.includes(
            "Custom Slippage for auto buy"
          ):
            await replyMessage.slippageAutoBuyHandler({ bot, redis, msg });
            break;
          case msg.reply_to_message.text.includes("Token Address to snipe"):
            await replyMessage.tokenSnipeHandler({ bot, redis, msg, chains });
            break;
          case msg.reply_to_message.text.includes("Minimum Liquidity to snipe"):
            await replyMessage.minLiquiditySnipeHandler({
              bot,
              redis,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes("Maximum Liquidity to snipe"):
            await replyMessage.maxLiquiditySnipeHandler({
              bot,
              redis,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes("Amount to snipe"):
            await replyMessage.amountSnipeHandler({ bot, redis, msg, chains });
            break;
          case msg.reply_to_message.text.includes("to Approve to snipe"):
            await replyMessage.approveGweiSnipeHandler({
              bot,
              redis,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes("Tax on buy to snipe"):
            await replyMessage.buyTaxSnipeHandler({ bot, redis, msg, chains });
            break;
          case msg.reply_to_message.text.includes("Tip to snipe"):
            await replyMessage.tipSnipeHandler({ bot, redis, msg, chains });
            break;
          case msg.reply_to_message.text.includes("Amount to be transferred"):
            await replyMessage.ethTransferHandler({ bot, redis, msg });
            break;
          case msg.reply_to_message.text.includes("Amount to be spent"):
            await replyMessage.ethSpentHandler({ bot, redis, msg });
            break;
          case msg.reply_to_message.text.includes("Amount per transaction"):
            await callback.copyTrade.tokenAmountHandler({
              bot,
              redis,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes("% of Bag to be sold"):
            await replyMessage.bagToSoldHandler({ bot, redis, msg });
            break;
          case msg.reply_to_message.text.includes(
            "Enter the wallet address that you wish to add to your copy trade list"
          ):
            await callback.copyTrade.enterAddressHandler({
              bot,
              redis,
              botdb,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes(
            "recipient to transfer token"
          ):
            await replyMessage.recepientToTokenHandler({
              bot,
              redis,
              msg,
              EvmChain,
              Moralis,
              token_list,
              chains,
              ethers,
              getWallet,
            });
            break;
          case msg.reply_to_message.text.includes("recipient to transfer"):
            await replyMessage.recepientToEthHandler({
              bot,
              redis,
              msg,
              summary,
            });
            break;
          case msg.reply_to_message.text.includes(
            "line number(s) of token(s) you want to transfer"
          ):
            await replyMessage.lineNumberToTransferHandler({
              bot,
              redis,
              msg,
              chains,
              token_list,
              ethers,
              getWallet,
              transferToken,
            });
            break;
          case msg.reply_to_message.text.includes(
            "line number(s) of token(s) you want to sell"
          ):
            await replyMessage.lineNumberToSellHandler({
              bot,
              redis,
              msg,
              ethers,
              getWallet,
              token_list,
              chains,
            });
            break;
          //baru
          case msg.reply_to_message.text.includes(
            "line number of the address you wish to remove"
          ):
            await callback.copyTrade.enterRemoveHandler({
              bot,
              redis,
              botdb,
              msg,
              chains,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_UPDATE_KEY_PROMPT_MESSAGE
          ):
            await replyMessage.velaUpdateKeyHandler({
              bot,
              redis,
              msg,
              logger,
              saveVelaApiKey,
              timeouting,
            });
            break;
          case msg.reply_to_message.text.includes(VELA_LIST_PROMPT_MESSAGE):
            await replyMessage.velaListAssetPairHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_COLLATERAL_PROMPT_MESSAGE
          ):
            await replyMessage.velaColateralHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(VELA_AMOUNT_PROMPT_MESSAGE):
            await replyMessage.velaAmountHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(VELA_SLIPPAGE_PROMPT_MESSAGE):
            await replyMessage.velaSlippageHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_LIMIT_PRICE_PROMPT_MESSAGE
          ):
            await replyMessage.velaLimitPriceHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_STOP_PRICE_PROMPT_MESSAGE
          ):
            await replyMessage.velaStopPriceHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_TAKE_PROFIT_PROMPT_MESSAGE
          ):
            await replyMessage.velaTakeProfitHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            VELA_STOP_LOSS_PROMPT_MESSAGE
          ):
            await replyMessage.velaStopLossHandler({
              bot,
              redis,
              msg,
              setShowVelaOrderOptions,
            });
            break;
          case msg.reply_to_message.text.includes(
            COINGECKO_AMOUNT_PROMPT_MESSAGE
          ):
            await replyMessage.coinGeckoAmountHandler({
              bot,
              redis,
              msg,
            });
            break;
          case msg.reply_to_message.text.includes(
            COINGECKO_SLIPPAGE_PROMPT_MESSAGE
          ):
            await replyMessage.coinGeckoSlipageHandler({
              bot,
              redis,
              msg,
            });
            break;
          case msg.reply_to_message.text.includes(SLIPPAGE_PROMPT):
            await replyMessage.slippageCustomHandler({ bot, msg, redis });
            break;
          case msg.reply_to_message.text.includes(selltoken.SLIPPAGE_PROMPT):
            await replyMessage.slippageSellCustomHandler({ bot, msg, redis });
            break;
          case msg.reply_to_message.text.includes(coingecko.SLIPPAGE_PROMPT):
            await replyMessage.slippageCategoryCustomHandler({
              bot,
              msg,
              redis,
            });
            break;
        }
      }

      if (showVelaOrderOptions) {
        // get chains
        const chains = structuredClone(VELA_SUPPORTED_CHAINS);
        const chainused = Number(
          await redis.GET(msg.chat.id + VELA_ORDER_CHAIN)
        );

        for (let i = 0; i < chains.length; i++) {
          chains[i].callback_data = `!velaOrderSetChain:${chains[i].chain_id}`;
          chains[i].text = chains[i].chain_name;
          if (chains[i].chain_id === chainused) {
            chains[i].text += " \u2705";
          }
        }

        const isLong = JSON.parse(
          await redis.GET(msg.chat.id + VELA_ORDER_IS_LONG)
        );
        const tokenId = JSON.parse(
          await redis.GET(msg.chat.id + VELA_ASSET_ID)
        );
        const position = await redis.GET(msg.chat.id + VELA_ORDER_POSITION);
        const orderCollateralAmount = await redis.GET(
          msg.chat.id + VELA_ORDER_COLLATERAL_ID
        );
        const orderAmount = await redis.GET(msg.chat.id + VELA_ORDER_AMOUNT);
        const slippageAmount = await redis.GET(
          msg.chat.id + VELA_ORDER_SLIPPAGE
        );
        const LimitPrice = await redis.GET(
          msg.chat.id + VELA_ORDER_LIMIT_PRICE
        );
        const StopPrice = await redis.GET(msg.chat.id + VELA_ORDER_STOP_PRICE);
        const takeProfit = JSON.parse(
          await redis.GET(msg.chat.id + VELA_TAKE_PROFIT_TOGGLE)
        );
        const stopLoss = JSON.parse(
          await redis.GET(msg.chat.id + VELA_STOP_LOSS_TOGGLE)
        );
        const takeProfitValue = await redis.GET(
          msg.chat.id + VELA_TAKE_PROFIT_VALUE
        );
        const stopLossValue = await redis.GET(
          msg.chat.id + VELA_STOP_LOSS_VALUE
        );

        bot.deleteMessage(msg.chat.id, msg.message_id);

        let optionalInlineKeyboard = [];

        if (position === "Limit" || position === "Stop Limit") {
          optionalInlineKeyboard.push([
            {
              text: `Limit Price${
                LimitPrice === null || isNaN(LimitPrice)
                  ? ""
                  : `: ${LimitPrice}$`
              }`,
              callback_data: VELA_LIMIT_PRICE_CALLBACK,
            },
          ]);
        }
        if (position === "Stop Market" || position === "Stop Limit") {
          optionalInlineKeyboard.push([
            {
              text: `Stop Price${
                StopPrice === null || isNaN(StopPrice) ? "" : `: ${StopPrice}$`
              }`,
              callback_data: VELA_STOP_PRICE_CALLBACK,
            },
          ]);
        }
        if (position === "Market") {
          optionalInlineKeyboard.push(
            // =========== Slippage ==========
            [
              {
                text: `Slippage${
                  slippageAmount === null || isNaN(slippageAmount)
                    ? " (Default 1%)"
                    : ": " + slippageAmount + "%"
                }`,
                callback_data: VELA_ORDER_SLIPPAGE_CALLBACK,
              },
            ]
          );
        }
        if (takeProfit) {
          optionalInlineKeyboard.push([
            {
              text: `Take Profit Price${
                takeProfitValue === null || isNaN(takeProfitValue)
                  ? "(higher than entry price)"
                  : `: ${takeProfitValue}$`
              }`,
              callback_data: VELA_TAKE_PROFIT_VALUE_CALLBACK,
            },
          ]);
        }
        if (stopLoss) {
          optionalInlineKeyboard.push([
            {
              text: `Stop Loss Amount${
                stopLossValue === null || isNaN(stopLossValue)
                  ? ""
                  : `: ${stopLossValue}$`
              }`,
              callback_data: VELA_STOP_LOSS_VALUE_CALLBACK,
            },
          ]);
        }

        let warningMessagesInlineKeyboard = [];
        // warning message if amount and collateral are both set, BUT amount is less than collateral
        if (
          orderAmount !== null &&
          !isNaN(orderAmount) &&
          orderCollateralAmount !== null &&
          !isNaN(orderCollateralAmount) &&
          orderCollateralAmount >= orderAmount
        ) {
          warningMessagesInlineKeyboard.push([
            {
              text: `\n\n\uD83D\uDFE1 WARNING: amount must be greater than collateral`,
              callback_data: VELA_ORDER_AMOUNT_CALLBACK,
            },
          ]);
        }

        let message = await summary(msg);
        message += "<strong>Place an order on Vela!</strong>\n";
        message += "1. Select a chain to trade on\n";
        message +=
          "2. Select the asset Id you want to trade from the <a href='https://docs.vela.exchange/vela-knowledge-base/developers/asset-pairs-and-velaid'>Vela list</a>!\n";
        message += "3. Select Long or Short\n";
        message += "4. Select Position Type\n";
        message += "5. Select collateral amount (Minimum 20)\n";
        message +=
          "6. Select leverage amount (Must be greater than collateral amount)\n";
        message += "7. Select Slippage\n";
        message += "8. select Limit / Stop Price if applicable\n";
        message += "9. [optional] select Take Profit Price / Stop Loss Price\n";

        sellMsg = await bot.sendMessage(msg.chat.id, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u2261 Menu",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
              // ========= CHAIN =============
              [
                {
                  text: " ====== Select Chain ====== ",
                  callback_data: "none",
                },
              ],
              chains,
              // ========== TOKEN ID ================
              [
                {
                  text: `Token Id: ${
                    tokenId === null || isNaN(tokenId) ? "" : `: ${tokenId}`
                  }`,
                  callback_data: VELA_SELECT_TOKEN_ID_CALLBACK,
                },
              ],

              // ========== IS LONG ================
              [
                {
                  text: " ====== Long Or Short ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${isLong !== null && isLong ? "\u2705 " : ""}Long`,
                  callback_data: VELA_LONG_CALLBACK_DATA,
                },
                {
                  text: `${isLong !== null && !isLong ? "\u2705" : ""}Short`,
                  callback_data: VELA_SHORT_CALLBACK_DATA,
                },
              ],

              // ========== POSITION ================
              // note: don't forget to provide the optional fields depending on the position
              [
                {
                  text: " ====== Select Position ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${position === "Limit" ? "\u2705 " : ""}Limit`,
                  callback_data: "!velaOrderPosition:Limit",
                },
                {
                  text: `${position === "Market" ? "\u2705 " : ""}Market`,
                  callback_data: "!velaOrderPosition:Market",
                },
              ],
              [
                {
                  text: `${
                    position === "Stop Market" ? "\u2705 " : ""
                  }Stop Market`,
                  callback_data: "!velaOrderPosition:Stop Market",
                },
                {
                  text: `${
                    position === "Stop Limit" ? "\u2705 " : ""
                  }Stop Limit`,
                  callback_data: "!velaOrderPosition:Stop Limit",
                },
              ],

              // ========== TPSL ================
              [
                {
                  text: " ====== TPSL ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${takeProfit ? "\u2705 " : ""}Take Profit`,
                  callback_data: VELA_TAKE_PROFIT_TOGGLE_CALLBACK,
                },
                {
                  text: `${stopLoss ? "\u2705 " : ""}Stop Loss`,
                  callback_data: VELA_STOP_LOSS_TOGGLE_CALLBACK,
                },
              ],
              // =========== COLLATERAL AMOUNT ==========
              [
                {
                  text: `Collateral (Minimum 20$)${
                    orderCollateralAmount === null ||
                    isNaN(orderCollateralAmount)
                      ? ""
                      : ": " + orderCollateralAmount + "$"
                  }`,
                  callback_data: VELA_ORDER_COLLATERAL_AMOUNT_CALLBACK,
                },
              ],
              // =========== Amount / Size ==========
              [
                {
                  text: `Select Amount${
                    orderAmount === null || isNaN(orderAmount)
                      ? ""
                      : `:  ${orderAmount}$`
                  }`,
                  callback_data: VELA_ORDER_AMOUNT_CALLBACK,
                },
              ],
            ]
              .concat(optionalInlineKeyboard)
              .concat(warningMessagesInlineKeyboard)
              .concat([
                [
                  {
                    text: "Place Vela Order!",
                    callback_data: VELA_PLACE_ORDER_CALLBACK,
                  },
                ],
              ]),
          },
        });
      }
    } catch (error) {
      logger.error("ON MESSAGE ERROR: " + error);
      errorMessageHandler(bot, msg);
    }
  });

  // on callback query - button press in bot
  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    // action
    const action = callbackQuery.data;

    // message
    const msg = callbackQuery.message;

    //
    try {
      //
      let showVelaOrderOptions = false;
      let showVelaApiOptions = false;
      let showCoingeckoCategoryOptions = false;
      const setShowVelaOrderOptions = (value) => {
        showVelaOrderOptions = value;
      };
      const setShowVelaApiOptions = (value) => {
        showVelaApiOptions = value;
      };
      const setShowCoingeckoCategoryOptions = (value) => {
        showCoingeckoCategoryOptions = value;
      };

      switch (true) {
        case action.includes(WALLET_CALLBACKDATA):
          await callback.walletHandler({
            bot,
            redis,
            msg,
            action,
            botdb,
            Moralis,
            getWallet,
            chains,
          });
          break;
        case action.includes(ACTION_WALLET_CALLBACK_DATA):
          await callback.actionWalletHandler({
            bot,
            redis,
            msg,
            action,
            chains,
            botdb,
            getWallet,
            token_list,
            Moralis,
            timeouting,
          });
          break;
        case action.includes(TRANSFER_PERCENT_ETH_INCLUDES):
          await callback.transferPercentEthIncludeHandler({
            bot,
            msg,
            action,
          });
          break;
        case action.includes(TRANSFER_AMOUNT_ETH_INCLUDES):
          await callback.tranferAmountEthIncludeHandler({
            bot,
            msg,
            action,
          });
          break;
        case action.includes(SELL_PERCENT_SELECT_INCLUDES):
          await callback.sellPercentSelectIncludeHandler({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(BUY_SELECTION_ETH_INCLUDES):
          await callback.buySelectionIncludeHandler({
            bot,
            redis,
            msg,
            action,
          });
          break;
        case action.includes(BUY_SELECTION_WALLET_INCLUDES):
          await callback.buySelectionIncludeWalletHandler({
            bot,
            redis,
            msg,
            action,
          });
          break;
        case action.includes(TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK):
          await callback.transferDestinationWalletTokenHandler({
            bot,
            redis,
            msg,
            action,
          });
          break;
        case action.includes(TRANSFER_DESTINATION_WALLET_ETH_CALLBACK):
          await callback.transferDestinationWalletEthHandler({
            bot,
            redis,
            msg,
            action,
          });
          break;
        case action.includes(TRANSFER_CUSTOM_AMOUNT_ETH):
          await callback.transferCustomAmountHandler({
            bot,
            redis,
            msg,
            action,
          });
          break;
        case action.includes(SELL_PERCENT_CUSTOM_AMOUNT):
          await callback.sellPercentCustomHandler({ bot, redis, msg });
          break;
        case action.includes(BUY_CUSTOM_AMOUNT_ETH):
          await callback.buyAmountCustomEthHandler({ bot, redis, msg });
          break;
        case action.includes(BUY_ENTER_TOKEN_ADDRESS):
          await callback.buyEnterCustomAddressHandler({ bot, redis, msg });
          break;
        case action.includes(BUY_REFERENCE):
          await replyMessage.erc20TokenBuyHandler({
            bot,
            redis,
            msg,
            logger,
            ethers,
            chains,
            fromRef: true,
          });
          break;
        case action.includes(SELL_SELECT_TOKENS):
          await callback.sellSelectTokenHandler({
            bot,
            redis,
            msg,
            getWallet,
            Moralis,
            token_list,
            chains,
          });
          break;
        case action.includes(BUY_TOKEN_CALLBACK_DATA):
          await callback.buyTokenHandler({ bot, redis, msg });
          break;
        case action.includes(SELL_TOKEN_CALLBACK_DATA):
          await callback.sellTokenHandler({ bot, redis, msg });
          break;
        case action.includes(BUY_CONTINUE_CALLBACK_DATA):
          await callback.buyContinueHandler({
            bot,
            redis,
            msg,
            getWallet,
            buyTokenUseETH1Inch,
            dispatch,
            // messageEditor,
            buyExecutor,
            actorReset,
            chains,
          });
          break;
        case action.includes(BUY_CANCEL_CALLBACK_DATA):
          await callback.buyCancelHandler({ bot, msg, redis });
          break;
        case action.includes(TRANSFER_CONTINUE_ETH):
          await callback.transferContinueEthHandler({
            bot,
            redis,
            msg,
            getWallet,
            transferETH,
            chains,
          });
          break;
        case action.includes(TRANSFER_CANCEL_ETH):
          await callback.transferCancelEthHandler({ bot, msg, redis });
          break;
        case action.includes(BACK_KEYBOARD_CALLBACK_DATA):
          await callback.backKeyboardHandler({ bot, redis, msg, timeouting });
          break;
        case action.includes("!chain"):
          await callback.chainHandler({ bot, redis, action, msg });
          break;
        case action.includes(MENU_KEYBOARD_CALLBACK_DATA):
          await callback.menuKeyboardHandler({ bot, redis, msg });
          break;
        case action.includes("!copytrade"):
          await callback.copyTrade.copyTradeHandler({
            bot,
            redis,
            msg,
            botdb,
            chains,
            app,
            getWallet,
          });
          break;
        case action.includes("!copyrmvaddress"):
          //
          await callback.copyTrade.removeAddressHandler({
            bot,
            redis,
            msg,
            address_list,
            chains,
          });
          break;
        case action.includes("!copyaddaddress"):
          await callback.copyTrade.addAddressHandler({ bot, redis, msg });
          break;
        case action.includes("!copymaxspend"):
          await callback.copyTrade.maxSpendHandler({ bot, redis, msg });
          break;
        case action.includes("!copyprofitsell"):
          await callback.copyTrade.profitSellHandler({
            bot,
            redis,
            msg,
            chains,
          });
          break;
        case action.includes("!copyselect"):
          await callback.copyTrade.selectHandler({
            bot,
            redis,
            action,
            msg,
            chains,
          });
          break;
        case action.includes("!copyevent"):
          await callback.copyTrade.eventHandler({
            bot,
            redis,
            action,
            msg,
            chains,
            botdb,
          });
          break;
        case action.includes("!copywallet"):
          await callback.copyTrade.walletHandler({
            bot,
            redis,
            action,
            msg,
            chains,
            botdb,
          });
          break;
        case action.includes("!perpetual"):
          await callback.perpetualHandler({
            msg,
            getVelaApiKey,
            setShowVelaApiOptions,
            setShowVelaOrderOptions,
          });
          break;
        case action.includes("!apiKey"):
          setShowVelaApiOptions(true);
          break;
        case action.includes("!actionApiKey"):
          await callback.actionApiKeyHandler({
            bot,
            action,
            redis,
            msg,
            chains,
          });
          break;
        case action.includes(VELA_LONG_CALLBACK_DATA):
          setShowVelaOrderOptions(true);
          await redis.SET(msg.chat.id + VELA_ORDER_IS_LONG, "true");
          break;
        case action.includes(VELA_SHORT_CALLBACK_DATA):
          setShowVelaOrderOptions(true);
          await redis.SET(msg.chat.id + VELA_ORDER_IS_LONG, "false");
          break;
        case action.includes(VELA_SELECT_TOKEN_ID_CALLBACK):
          await callback.velaSelectTokenIdHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_ORDER_COLLATERAL_AMOUNT_CALLBACK):
          await callback.velaOrderCollateralHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_ORDER_POSITION_CALLBACK):
          await callback.velaOrderPositionHandler({
            action,
            setShowVelaOrderOptions,
            redis,
            msg,
          });
          break;
        case action.includes(VELA_ORDER_AMOUNT_CALLBACK):
          await callback.velaOrderAmountHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_ORDER_SLIPPAGE_CALLBACK):
          await callback.velaOrderSlippageHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_LIMIT_PRICE_CALLBACK):
          await callback.velaLimitPriceHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_STOP_PRICE_CALLBACK):
          await callback.velaStopPriceHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_ORDER_SET_CHAIN_CALLBACK):
          await callback.velaOrderSetChainHandler({
            setShowVelaOrderOptions,
            action,
            redis,
            msg,
          });
          break;
        case action.includes(VELA_TAKE_PROFIT_TOGGLE_CALLBACK):
          await callback.velaTakeProfitToggleHandler({
            setShowVelaOrderOptions,
            redis,
            msg,
          });
          break;
        case action.includes(VELA_STOP_LOSS_TOGGLE_CALLBACK):
          await callback.velaStopLossToggleHandler({
            setShowVelaOrderOptions,
            redis,
            msg,
          });
          break;
        case action.includes(VELA_TAKE_PROFIT_VALUE_CALLBACK):
          await callback.velaTakeProfitValueHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_STOP_LOSS_VALUE_CALLBACK):
          await callback.velaStopLossValueHandler({ bot, redis, msg });
          break;
        case action.includes(VELA_PLACE_ORDER_CALLBACK):
          await callback.velaPlaceOrderHandler({ bot, redis, msg, chains });
          break;
        case action.includes(COINGECKO_CATEGORY_CALLBACK_DATA):
          await callback.categoryBuy.coinGeckoCategoryHandler({
            bot,
            redis,
            msg,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_TOKENS_CALLBACK):
          await callback.categoryBuy.coinGeckoCategoryTokensHandler({
            redis,
            action,
            msg,
            setShowCoingeckoCategoryOptions,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_UPDATE_AMOUNT):
          await callback.categoryBuy.coinGeckoCategoryUpdateAmountHandler({
            bot,
            redis,
            msg,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_UPDATE_SLIPPAGE):
          await callback.categoryBuy.coinGeckoCategoryUpdateSlippageHandler({
            bot,
            redis,
            msg,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_UPDATE_NETWORK):
          await callback.categoryBuy.coinGeckoCategoryUpdateNetworkHandler({
            action,
            redis,
            setShowCoingeckoCategoryOptions,
            msg,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_UPDATE_WALLET):
          await callback.categoryBuy.coinGeckoCategoryUpdateWalletHandler({
            bot,
            redis,
            action,
            msg,
          });
          break;
        case action.includes(COINGECKO_CATEGORY_BUY_CALLBACK):
          await callback.categoryBuy.coinGeckoCategoryBuyHandler({
            bot,
            redis,
            msg,
            getWallet,
          });
          break;
        case action.includes(SLIPPAGE_SELECT):
          await callback.slippageSelectHandler({ bot, redis, msg, action });
          break;
        case action.includes(SLIPPAGE_CUSTOM_AMOUNT):
          await callback.customSlippageHandler({ bot, redis, msg });
          break;
        case action.includes(selltoken.SLIPPAGE_SELECT):
          await callback.slippageSellSelectHandler({ bot, msg, action, redis });
          break;
        case action.includes(selltoken.SLIPPAGE_CUSTOM_AMOUNT):
          await callback.sellCustomSlippageHandler({ bot, redis, msg });
          break;
        case action.includes(COINGECKO_SELECTION_WALLET_INCLUDES):
          await callback.categoryBuy.coinGeckoSelectionIncludeWallet({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(COINGECKO_SELECTION_ETH_INCLUDES):
          await callback.categoryBuy.coinGeckoSelectionIncludeEth({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(COINGECKO_CUSTOM_AMOUNT_ETH):
          await callback.categoryBuy.coinGeckoCustomAmountEthHandler({
            bot,
            redis,
            msg,
          });
          break;
        case action.includes(COINGECKO_SELECT_CATEGORY_CALLBACK):
          await callback.categoryBuy.coinGeckoSelectCategoryHandler({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(COINGECKO_ENTER_TOKEN_ADDRESS):
          await callback.categoryBuy.coinGeckoEnterCustomAddressHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes(COINGECKO_CONTINUE_CALLBACK_DATA):
          await callback.categoryBuy.coinGeckoCategoryBuyHandler({
            msg,
            bot,
            redis,
            getWallet,
          });
          break;
        case action.includes(coingecko.SLIPPAGE_SELECT):
          await callback.categoryBuy.slippageCategorySelectHandler({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(coingecko.SLIPPAGE_CUSTOM_AMOUNT):
          await callback.categoryBuy.categoryCustomSlippageHandler({
            bot,
            msg,
            action,
            redis,
          });
          break;
        case action.includes(SELECT_CHAIN):
          await callback.selectChainHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes(SETTING_CALLBACK):
          await callback.settingHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes(PRIVATE_TXN):
          await callback.privateTxnHandler({ bot, msg, redis, action });
          break;
        case action.includes(POINT_CALLBACK):
          await callback.pointHandler({ bot, msg, redis });
          break;
        case action.includes(REFERRAL_CALLBACK):
          await callback.referralHandler({ bot, msg }); // bbb.1 from here take action
          break;
        case action.includes("!autobuysubmit"):
          await callback.autoBuy.autoBuySubmit({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!snipesettingssubmit"):
          await callback.tokenSnipe.snipeSubmit({
            bot,
            msg,
            redis,
            action,
            chains,
          });
          break;
        case action.includes("!snipegwei:approve"):
          await callback.tokenSnipe.snipeApproveGweiHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!snipebuytax"):
          await callback.tokenSnipe.snipeBuyTaxHandler({ bot, msg, redis });
          break;
        case action.includes("!snipeminliq"):
          await callback.tokenSnipe.snipeMinLiquidityHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!snipemaxliq"):
          await callback.tokenSnipe.snipeMaxLiquidityHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!snipeaddress"):
          await callback.tokenSnipe.snipeTokenHandler({ bot, msg, redis });
          break;
        case action.includes("!snipeamount"):
          await callback.tokenSnipe.snipeAmountHandler({ bot, msg, redis });
          break;
        case action.includes("!snipetip"):
          await callback.tokenSnipe.snipeTipHandler({ bot, msg, redis });
          break;
        case action.includes("!snipefirstbundle"):
          await callback.tokenSnipe.snipeFirstOrFail({ bot, msg, redis });
          break;
        case action.includes("!snipedegenmode"):
          await callback.tokenSnipe.snipeDegenMode({ bot, msg, redis });
          break;
        case action.includes("!snipepreapprove"):
          await callback.tokenSnipe.snipePreApprove({ bot, msg, redis });
          break;
        case action.includes("!snipeblacklist"):
          await callback.tokenSnipe.snipeTxOnBlacklist({ bot, msg, redis });
          break;
        case action.includes("!snipemaxtx"):
          await callback.tokenSnipe.snipeMaxTx({ bot, msg, redis });
          break;
        case action.includes("!snipemintx"):
          await callback.tokenSnipe.snipeMinTx({ bot, msg, redis });
          break;
        case action.includes("!snipeantirug"):
          await callback.tokenSnipe.snipeAntiRug({ bot, msg, redis });
          break;
        case action.includes("!snipewallet"):
          await callback.tokenSnipe.snipeWallet({
            bot,
            msg,
            redis,
            action,
            chains,
          });
          break;
        case action.includes("!snipetoken"):
          await callback.tokenSnipe.snipeHandler({ bot, msg, redis, chains });
          break;
        case action.includes("!snipesettings1"):
          await callback.tokenSnipe.snipeSettings1({ bot, msg, redis, chains });
          break;
        case action.includes("!snipesettings2"):
          await callback.tokenSnipe.snipeSettings2({ bot, msg, redis, chains });
          break;
        case action.includes("!autobuysettings"):
          await callback.autoBuy.autoBuyHandler({ bot, msg, redis });
          break;
        case action.includes("!autoamountcustom"):
          await callback.autoBuy.autoBuyCustomAmountHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!autoslippagecustom"):
          await callback.autoBuy.autoBuyCustomSlippageHandler({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!autounit"):
          await callback.autoBuy.autoBuyUnit({
            bot,
            msg,
            redis,
            action,
          });
          break;
        case action.includes("!autoprivateselect"):
          await callback.autoBuy.autoBuyPrivate({
            bot,
            msg,
            redis,
          });
          break;
        case action.includes("!autoamountselect"):
          await callback.autoBuy.autoBuyAmount({
            bot,
            msg,
            redis,
            action,
          });
          break;
        case action.includes("!autoslippageselect"):
          await callback.autoBuy.autoBuySlippage({
            bot,
            msg,
            redis,
            action,
          });
          break;
        case action.includes("!autowallet"):
          await callback.autoBuy.autoBuyWallet({
            bot,
            msg,
            redis,
            action,
          });
          break;
        case action.includes(BUY_SELECT_TOKEN):
          await callback.buySelectionIncludeToken({ bot, msg, redis, action });
          break;
        case action.includes(SELL_SELECT_CURRENCY):
          await callback.sellSelectionIncludeToken({ bot, msg, redis, action });
          break;
        case action.includes(CATEGORY_SELECT_TOKEN):
          await callback.categoryBuy.categorySelectionIncludeToken({
            bot,
            msg,
            redis,
            action,
          });
          break;
      }

      //
      if (showVelaOrderOptions) {
        // get chains
        const chains = structuredClone(VELA_SUPPORTED_CHAINS);
        const chainused = Number(
          await redis.GET(msg.chat.id + VELA_ORDER_CHAIN)
        );

        for (let i = 0; i < chains.length; i++) {
          chains[i].callback_data = `!velaOrderSetChain:${chains[i].chain_id}`;
          chains[i].text = chains[i].chain_name;
          if (chains[i].chain_id === chainused) {
            chains[i].text += " \u2705";
          }
        }

        const isLong = JSON.parse(
          await redis.GET(msg.chat.id + VELA_ORDER_IS_LONG)
        );
        const tokenId = JSON.parse(
          await redis.GET(msg.chat.id + VELA_ASSET_ID)
        );
        const position = await redis.GET(msg.chat.id + VELA_ORDER_POSITION);
        const orderCollateralAmount = await redis.GET(
          msg.chat.id + VELA_ORDER_COLLATERAL_ID
        );
        const orderAmount = await redis.GET(msg.chat.id + VELA_ORDER_AMOUNT);
        const slippageAmount = await redis.GET(
          msg.chat.id + VELA_ORDER_SLIPPAGE
        );
        const LimitPrice = await redis.GET(
          msg.chat.id + VELA_ORDER_LIMIT_PRICE
        );
        const StopPrice = await redis.GET(msg.chat.id + VELA_ORDER_STOP_PRICE);
        const takeProfit = JSON.parse(
          await redis.GET(msg.chat.id + VELA_TAKE_PROFIT_TOGGLE)
        );
        const stopLoss = JSON.parse(
          await redis.GET(msg.chat.id + VELA_STOP_LOSS_TOGGLE)
        );
        const takeProfitValue = await redis.GET(
          msg.chat.id + VELA_TAKE_PROFIT_VALUE
        );
        const stopLossValue = await redis.GET(
          msg.chat.id + VELA_STOP_LOSS_VALUE
        );

        bot.deleteMessage(msg.chat.id, msg.message_id);

        let optionalInlineKeyboard = [];

        if (position === "Limit" || position === "Stop Limit") {
          optionalInlineKeyboard.push([
            {
              text: `Limit Price${
                LimitPrice === null || isNaN(LimitPrice)
                  ? ""
                  : `: ${LimitPrice}$`
              }`,
              callback_data: VELA_LIMIT_PRICE_CALLBACK,
            },
          ]);
        }
        if (position === "Stop Market" || position === "Stop Limit") {
          optionalInlineKeyboard.push([
            {
              text: `Stop Price${
                StopPrice === null || isNaN(StopPrice) ? "" : `: ${StopPrice}$`
              }`,
              callback_data: VELA_STOP_PRICE_CALLBACK,
            },
          ]);
        }
        if (position === "Market") {
          optionalInlineKeyboard.push(
            // =========== Slippage ==========
            [
              {
                text: `Slippage${
                  slippageAmount === null || isNaN(slippageAmount)
                    ? " (Default 1%)"
                    : ": " + slippageAmount + "%"
                }`,
                callback_data: VELA_ORDER_SLIPPAGE_CALLBACK,
              },
            ]
          );
        }

        if (takeProfit) {
          optionalInlineKeyboard.push([
            {
              text: `Take Profit Price${
                takeProfitValue === null || isNaN(takeProfitValue)
                  ? ""
                  : `: ${takeProfitValue}$`
              }`,
              callback_data: VELA_TAKE_PROFIT_VALUE_CALLBACK,
            },
          ]);
        }
        if (stopLoss) {
          optionalInlineKeyboard.push([
            {
              text: `Stop Loss Amount${
                stopLossValue === null || isNaN(stopLossValue)
                  ? ""
                  : `: ${stopLossValue}$`
              }`,
              callback_data: VELA_STOP_LOSS_VALUE_CALLBACK,
            },
          ]);
        }

        let warningMessagesInlineKeyboard = [];
        // warning message if amount and collateral are both set, BUT amount is less than collateral
        if (
          orderAmount !== null &&
          !isNaN(orderAmount) &&
          orderCollateralAmount !== null &&
          !isNaN(orderCollateralAmount) &&
          orderCollateralAmount >= orderAmount
        ) {
          warningMessagesInlineKeyboard.push([
            {
              text: `\n\n\uD83D\uDFE1 WARNING: amount must be greater than collateral`,
              callback_data: VELA_ORDER_AMOUNT_CALLBACK,
            },
          ]);
        }

        let message = await summary(msg);
        message += "<strong>Place an order on Vela!</strong>\n";
        message += "1. Select a chain to trade on\n";
        message +=
          "2. Select the asset Id you want to trade from the <a href='https://docs.vela.exchange/vela-knowledge-base/developers/asset-pairs-and-velaid'>Vela list</a>!\n";
        message += "3. Select Long or Short\n";
        message += "4. Select Position Type\n";
        message += "5. Select collateral amount (Minimum 20)\n";
        message +=
          "6. Select leverage amount (Must be greater than collateral amount)\n";
        message += "7. Select Slippage\n";
        message += "8. select Limit / Stop Price if applicable\n";

        sellMsg = await bot.sendMessage(msg.chat.id, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u2261 Menu",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
              // ========= CHAIN =============
              [
                {
                  text: " ====== Select Chain ====== ",
                  callback_data: "none",
                },
              ],
              chains,
              // ========== TOKEN ID ================
              [
                {
                  text: `Token Id: ${
                    tokenId === null || isNaN(tokenId) ? "" : `: ${tokenId}`
                  }`,
                  callback_data: VELA_SELECT_TOKEN_ID_CALLBACK,
                },
              ],

              // ========== IS LONG ================
              [
                {
                  text: " ====== Long Or Short ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${isLong !== null && isLong ? "\u2705 " : ""}Long`,
                  callback_data: VELA_LONG_CALLBACK_DATA,
                },
                {
                  text: `${isLong !== null && !isLong ? "\u2705" : ""}Short`,
                  callback_data: VELA_SHORT_CALLBACK_DATA,
                },
              ],

              // ========== POSITION ================
              // note: don't forget to provide the optional fields depending on the position
              [
                {
                  text: " ====== Select Position ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${position === "Limit" ? "\u2705 " : ""}Limit`,
                  callback_data: "!velaOrderPosition:Limit",
                },
                {
                  text: `${position === "Market" ? "\u2705 " : ""}Market`,
                  callback_data: "!velaOrderPosition:Market",
                },
              ],
              [
                {
                  text: `${
                    position === "Stop Market" ? "\u2705 " : ""
                  }Stop Market`,
                  callback_data: "!velaOrderPosition:Stop Market",
                },
                {
                  text: `${
                    position === "Stop Limit" ? "\u2705 " : ""
                  }Stop Limit`,
                  callback_data: "!velaOrderPosition:Stop Limit",
                },
              ],

              // ========== TPSL ================
              [
                {
                  text: " ====== TPSL ====== ",
                  callback_data: "none",
                },
              ],
              [
                {
                  text: `${takeProfit ? "\u2705 " : ""}Take Profit`,
                  callback_data: VELA_TAKE_PROFIT_TOGGLE_CALLBACK,
                },
                {
                  text: `${stopLoss ? "\u2705 " : ""}Stop Loss`,
                  callback_data: VELA_STOP_LOSS_TOGGLE_CALLBACK,
                },
              ],
              // =========== COLLATERAL AMOUNT ==========
              [
                {
                  text: `Collateral (Minimum 20$)${
                    orderCollateralAmount === null ||
                    isNaN(orderCollateralAmount)
                      ? ""
                      : ": " + orderCollateralAmount + "$"
                  }`,
                  callback_data: VELA_ORDER_COLLATERAL_AMOUNT_CALLBACK,
                },
              ],
              // =========== Amount / Size ==========
              [
                {
                  text: `Select Amount${
                    orderAmount === null || isNaN(orderAmount)
                      ? ""
                      : `:  ${orderAmount}$`
                  }`,
                  callback_data: VELA_ORDER_AMOUNT_CALLBACK,
                },
              ],
            ]
              .concat(optionalInlineKeyboard)
              .concat(warningMessagesInlineKeyboard)
              .concat([
                [
                  {
                    text: "Place Vela Order!",
                    callback_data: VELA_PLACE_ORDER_CALLBACK,
                  },
                ],
              ]),
          },
        });
      } else if (showVelaApiOptions) {
        let message = `Vela API Key Settings.\n`;
        message += `Visit the <a href="${VELA_APP_WITH_REFERRAL_LINK}">Vela App</a> to obtain your your API key and API ID!\n`;
        message += `Click <a href="${VELA_TRADEBOT_API_DOCS}" >here</a> for more instructions\n`;

        const message_options = {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u2261 Menu",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
              [
                {
                  text: "Update Vela API Key",
                  callback_data:
                    "!actionApiKey" +
                    Number(action.split(":")[1]) +
                    ":updateApiKey",
                },
              ],
            ],
          },
        };

        const thisApiKeyMsg = await bot.sendMessage(
          msg.chat.id,
          message,
          message_options
        );

        await redis.SET(
          msg.chat.id + "_updateApiKey",
          thisApiKeyMsg.message_id
        );
        await redis.SET(
          msg.chat.id + LAST_CHAT,
          JSON.stringify({
            message,
            message_options,
          })
        );
      } else if (showCoingeckoCategoryOptions) {
        // delete original message - display category menu
        bot.deleteMessage(msg.chat.id, msg.message_id);

        // retrieve values
        const categoryNameCheck = await redis.GET(
          msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
        );

        const categoryIdCheck = await redis.GET(
          msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED
        );

        const categoryName = categoryNameCheck.split("/")[0];
        const chainUsed = categoryNameCheck.split("/")[1];
        const categoryId = categoryIdCheck.split("/")[0];
        // const amount = await redis.GET(msg.chat.id + COINGECKO_AMOUNT);
        // const slippage = await redis.GET(msg.chat.id + COINGECKO_SLIPPAGE);
        // const network =
        //   chainUsed === "0"
        //     ? COINGECKO_PLATFORM_ETHEREUM
        //     : COINGECKO_PLATFORM_ARBITRUM;
        let network;
        switch (chainUsed) {
          case "0":
            network = COINGECKO_PLATFORM_ETHEREUM;
            break;
          case "1":
            network = COINGECKO_PLATFORM_ARBITRUM;
            break;
          case "2":
            network = COINGECKO_PLATFORM_AVALANCHE;
          case "3":
            network = COINGECKO_PLATFORM_METIS;
            break;
          case "4":
            network = COINGECKO_PLATFORM_SOLANA;
            break;
          case "5":
            network = COINGECKO_PLATFORM_BASE;
            break;
        }
        // const walletIndex = await redis.GET(
        //   msg.chat.id + COINGECKO_WALLET_INDEX
        // );

        // setup tokens to display
        const categoryTokens = coingeckoApis.getCategoryTokens(categoryId);
        const dbTokens = getCoingeckoTokens(network);
        const tokenLists = await Promise.all([categoryTokens, dbTokens]);
        const tokens = await coingeckoApis.retrieveTopTokens(
          tokenLists[0],
          tokenLists[1]
        );

        // add token addresses to redis
        await redis.SET(
          msg.chat.id + COINGECKO_ADDRESS_TOKENS,
          JSON.stringify(
            tokens.map((t) => {
              return {
                symbol: t.symbol,
                address: t.platforms[network],
              };
            })
          )
        );

        const tokenAddresses = JSON.parse(
          await redis.GET(msg.chat.id + COINGECKO_ADDRESS_TOKENS)
        );

        const tokenPrice = await Promise.all(
          tokenAddresses.map(async (address) => {
            try {
              // const res = await moralisDetails(
              //   Number(chainUsed),
              //   address.address
              // );
              // console.log(address);
              const res = await getCoinUsdPrice(
                Number(chainUsed),
                address.address
              );
              const formattedRes = formatNumber(res);
              return formattedRes;
            } catch (error) {
              return null;
            }
          })
        );

        // console.log("ON INDEX", { tokens, tokenPrice });

        let tokenReceived = [];

        const formattedTokens = tokens
          .filter((t, i) => {
            // console.log({ price: tokenPrice[i] });
            if (!tokenPrice[i]) {
              // console.log("SKIPPED");
              return false; // skip
            }
            tokenReceived = [
              ...tokenReceived,
              {
                symbol: t.symbol,
                address: t.address,
                received: tokenPrice[i],
              },
            ];
            return true;
          })
          .map((token, idx) => {
            // console.log({ tokenReceived: tokenReceived[idx] });
            return {
              Name: `<strong>${
                token.name
              } (${token.symbol.toUpperCase()})</strong>\n`,
              Price: `| Price:  $${tokenReceived[idx].received}\n`,
            };
          })
          .slice(0, 5);

        // setup message for category list
        const categories = await getCoingeckoCategories();
        // get top 10 categories
        const filteredCategories = categories.slice(0, 10);
        // format to use as button
        // const formattedCategories =
        //   chainUsed === "0"
        //     ? filteredCategories
        //         .filter(
        //           (c) =>
        //             `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${c.id}/${c.name}`
        //               .length < 64
        //         )
        //         .map((category, index, array) => {
        //           if (index % 2 === 0) {
        //             if (!array[index + 1]) {
        //               return [
        //                 {
        //                   text:
        //                     categoryName === category.name
        //                       ? `${category.name} \u2705`
        //                       : category.name,

        //                   callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
        //                 },
        //               ];
        //             }
        //             return [
        //               {
        //                 text:
        //                   action.split("/")[1] === category.name
        //                     ? `${category.name} \u2705`
        //                     : category.name,
        //                 // callback_data: "none",
        //                 callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
        //               },
        //               {
        //                 text:
        //                   action.split("/")[1] === array[index + 1].name
        //                     ? `${array[index + 1].name} \u2705`
        //                     : array[index + 1].name,
        //                 // callback_data: "none",
        //                 callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${
        //                   array[index + 1].id
        //                 }/${array[index + 1].name}`,
        //               },
        //             ];
        //           }
        //           return null;
        //         })
        //         .filter(Boolean)
        //     : [
        //         [
        //           {
        //             text:
        //               categoryName === COINGECKO_CATEGORY_NAME_ARBITRUM
        //                 ? `${categoryName} \u2705`
        //                 : categoryName,
        //             callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_ARBITRUM}/${COINGECKO_CATEGORY_NAME_ARBITRUM}`,
        //           },
        //         ],
        //       ];

        //
        // console.log({formattedCategories: JSON.stringify(formattedCategories), formattedTokens});

        let formattedCategories;
        switch (chainUsed) {
          case "0":
            formattedCategories = filteredCategories
              .filter(
                (c) =>
                  `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${c.id}/${c.name}`
                    .length < 64
              )
              .map((category, index, array) => {
                if (index % 2 === 0) {
                  if (!array[index + 1]) {
                    return [
                      {
                        text:
                          categoryName === category.name
                            ? `${category.name} \u2705`
                            : category.name,

                        callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
                      },
                    ];
                  }
                  return [
                    {
                      text:
                        categoryName === category.name
                          ? `${category.name} \u2705`
                          : category.name,

                      callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
                    },
                    {
                      text:
                        categoryName === array[index + 1].name
                          ? `${array[index + 1].name} \u2705`
                          : array[index + 1].name,

                      callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${
                        array[index + 1].id
                      }/${array[index + 1].name}`,
                    },
                  ];
                }
                return null;
              })
              .filter(Boolean);
            break;
          case "1":
            // console.log("masuk case 1");
            formattedCategories = [
              [
                {
                  text:
                    categoryName === COINGECKO_CATEGORY_NAME_ARBITRUM
                      ? `${categoryName} \u2705`
                      : categoryName,
                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_ARBITRUM}/${COINGECKO_CATEGORY_NAME_ARBITRUM}`,
                },
              ],
            ];
            break;
          case "2":
            formattedCategories = [
              [
                {
                  text:
                    categoryName === COINGECKO_CATEGORY_NAME_AVALANCHE
                      ? `${categoryName} \u2705`
                      : categoryName,
                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_AVALANCHE}/${COINGECKO_CATEGORY_NAME_AVALANCHE}`,
                },
              ],
            ];
            break;
          case "3":
            formattedCategories = [
              [
                {
                  text:
                    categoryName === COINGECKO_CATEGORY_NAME_METIS
                      ? `${categoryName} \u2705`
                      : categoryName,
                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_METIS}/${COINGECKO_CATEGORY_NAME_METIS}`,
                },
              ],
            ];
            break;
          case "4":
            formattedCategories = [
              [
                {
                  text:
                    categoryName === COINGECKO_CATEGORY_NAME_SOLANA
                      ? `${categoryName} \u2705`
                      : categoryName,
                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_SOLANA}/${COINGECKO_CATEGORY_NAME_SOLANA}`,
                },
              ],
            ];
            break;
          case "5":
            formattedCategories = [
              [
                {
                  text:
                    categoryName === COINGECKO_CATEGORY_NAME_BASE
                      ? `${categoryName} \u2705`
                      : categoryName,
                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_BASE}/${COINGECKO_CATEGORY_NAME_BASE}`,
                },
              ],
            ];
            break;
        }
        let message = await summary(msg);
        message += "<strong>Selected Category:</strong>\n";
        message += `${categoryName}\n`;
        message += `\n<strong>Top ${formattedTokens.length} Tokens:</strong>\n`;
        for (const formatedToken of formattedTokens) {
          message += formatedToken.Name;
          message += formatedToken.Price;
        }
        if (formattedTokens.length === 0) {
          message += "No Tokens Found in this category for this Networ\n\n";
        }
        message += "----------------------------\n";
        message += "<i>Powered by Coingecko</i>";

        const message_options = {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u21B6 Save and Close",
                  callback_data: COINGECKO_CATEGORY_CALLBACK_DATA,
                },
              ],
              ...formattedCategories,
            ],
          },
        };

        // setup last chat for back option in future screens
        await redis.SET(
          msg.chat.id + COINGECKO_SAVED_CATEGORY_TOKENS,
          JSON.stringify({
            message,
            message_options,
          })
        );

        // display list of categories user can choose from
        const newMenu = await bot.sendMessage(
          msg.chat.id,
          message,
          message_options
        );

        await redis.SET(
          msg.chat.id + COINGECKO_MENU_MESSAGE_ID,
          newMenu.message_id
        );
      }
    } catch (error) {
      //
      app.log.error("ON CALLBACK QUERY ERROR: ");
      app.log.error(error);

      errorMessageHandler(bot, msg);
    }
  });
};

// start app
const startApp = async () => {
  try {
    //
    await redis.connect();

    //
    await Moralis.start({
      apiKey: process.env.MORALIS_KEY,
      // ...and any other configuration
    });

    // CORS class config
    app.register(fastifyCors);

    // helmet security config
    app.register(fastifyHelmet);

    // using x-www-form-urlencoded
    app.register(fastifyFormbody);

    // error handler
    app.setNotFoundHandler(
      {
        preValidation: (_req, _reply, done) => {
          // your code
          done();
        },
        preHandler: (_req, _reply, done) => {
          // your code
          done();
        },
      },
      (_request, reply) => {
        // Default not found handler with preValidation and preHandler hooks
        return reply.code(404).send();
      }
    );

    // error handler
    app.setErrorHandler(function (error, _request, reply) {
      if (error instanceof fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
        // log error
        this.log.error(error.message);

        // Send error response
        return reply.code(500).send();
      } else {
        // log error
        this.log.error(error.message);

        // fastify will use parent error handler to handle this
        if (error.statusCode) {
          return reply.code(error.statusCode).send();
        }
        return reply.code(500).send();
      }
    });

    // ================== ROUTES FOR API REQUESTS =================== //
    // ============================================================== //
    app.get("/", (_request, reply) => {
      try {
        return reply.code(200).send("OK");
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.post("/telebot", (request, reply) => {
      try {
        //
        app.log.debug("MESSAGE TELEBOT: " + JSON.stringify(request.body.msg));

        //
        telebotQueue.enqueue(JSON.stringify(request.body.msg));

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    // app.register(require("./routes/routes"));

    app.listen({ port: Number(process.env.BOT_PORT || 8443), host: "0.0.0.0" }, (err) => {
      if (err) {
        app.log.error(err.message);
        process.exit(1);
      }
    });

    //
    dispatch(
      chainsGetter,
      {},
      {
        onCrash: actorReset,
      }
    );

    //
    dispatch(
      ethUsdChecker,
      {},
      {
        onCrash: actorReset,
      }
    );

    //
    tbot = new TelegramBot(process.env.TELEBOT, {
      polling: true,
    });

    //
    await onStart(tbot);
  } catch (error) {
    app.log.error("START APP ERROR: " + error.message);
  }
};

startApp();

// eth usd
new CronJob(
  process.env.CRONJOB_ETH_USD_SCHEDULE,
  async () => {
    //
    dispatch(
      ethUsdChecker,
      {},
      {
        onCrash: actorReset,
      }
    );

    //
    dispatch(
      gasTracker,
      {},
      {
        onCrash: actorReset,
      }
    );
  },
  null,
  true,
  "America/Toronto"
);

// update db with coingecko data
const updateDbCoingeckoCategories = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      await saveCoingeckoCategories();
    } catch (err) {
      app.log.error("UPDATE DB COINGECKO CATEGORIES ERROR: " + err.message);
    }
  },
  "updateDbCoingeckoCategories"
);

const updateDbCoingeckoTokens = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      await saveCoingeckoTokens();
      await saveCoingeckoTokensImg();
    } catch (err) {
      app.log.error("UPDATE DB COINGECKO TOKENS ERROR: " + err.message);
    }
  },
  "updateDbCoingeckoTokens"
);

const updateDbTokenPrice = spawnStateless(
  system,
  async (_msg, _ctx) => {
    try {
      await saveTokenPrice();
    } catch (err) {
      app.log.error("UPDATE DB TOKEN PRICE ERROR: " + err.message);
    }
  },
  "updateDbTokenPrice"
);

new CronJob(
  process.env.CRONJOB_UPDATE_CATEGORIES_SCHEDULE,
  async () => {
    dispatch(updateDbCoingeckoCategories, {}, { onCrash: actorReset });
  },
  null,
  true,
  "America/Toronto"
);

// new CronJob(
//   process.env.CRONJOB_UPDATE_TOKENS_SCHEDULE,
//   async () => {
//     dispatch(updateDbCoingeckoTokens, {}, { onCrash: actorReset });
//   },
//   null,
//   true,
//   "America/Toronto"
// );

new CronJob(
  process.env.CRONJOB_GOOD_NEWS_MANAGER,
  async () => {
    dispatch(goodNewsManager, {}, { onCrash: actorReset });
  },
  null,
  true,
  "America/Toronto"
);

// new CronJob(
//   process.env.CRONJOB_UPDATE_TOKEN_PRICE,
//   async () => {
//     dispatch(updateDbTokenPrice, {}, { onCrash: actorReset });
//   },
//   null,
//   true,
//   "America/Toronto"
// );

module.exports = app;
