// dotenv
require("dotenv").config();

// node_modules

// custom modules
const chatinfo = require("./chatinfo");
const { logger } = require("../helpers");
const { coingecko } = require("../constants");
const {
  MENU_KEYBOARD_CALLBACK_DATA,
  WALLET_CALLBACKDATA,
  BUY_TOKEN_CALLBACK_DATA,
  CHECK_WALLET,
} = require("../constants/buytoken");
const { SELL_TOKEN_CALLBACK_DATA } = require("../constants/selltoken");
const { COINGECKO_CATEGORY_CALLBACK_DATA } = require("../constants/coingecko");
const saveWallet = require("../databases/saveWallet");
const { getReferralKey } = require("../databases");
const { encodeReferral, generateKey } = require("../helpers/referralGenerator");
const { DATA_CHAIN_LIST } = require("../constants/chains");

// initiate variables
// const lock = "\uD83D\uDD12";

/**
 * begin(bot, msg)
 *
 * @param { object } bot
 * @param { object } msg
 */
module.exports = async (bot, msg, redis) => {
  try {
    // get chains
    // const chainsCache = await redis.GET("chainsCache");
    // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    // chat id as identifier for bot user
    const chatid = msg.chat.id;

    //
    const chainused = Number(await redis.GET(chatid + "_chain")) || 0;

    // console.log("1", { chains, chainused });


    //
    chains[chainused].text += " \u2705";

    // check chat_id to db
    const checkReferralKey = await getReferralKey(msg.chat.id);

    //
    if (!checkReferralKey?.key) {
      const referralKey = encodeReferral(msg.chat.id);
      await saveWallet(msg.chat.id, referralKey);
    }

    // generate user key
    const randomKey = await generateKey();
    // const randomKey = "supermantul";
    // console.log({ randomKey });

    const multi = redis.multi();
    multi.SET("lk_" + randomKey, msg.chat.id);
    multi.SET("site_" + randomKey, msg.chat.id);
    multi.EXPIRE("site_" + randomKey, 3600);

    await multi.exec();

    // message
    let message = await chatinfo(msg, redis);
    message += "The Name's Bot, James Bot.\n";
    // message += `${process.env.LAUNCHPAD_URL}?key=${randomKey}\n`;
    // message += `${process.env.FE_BASE_URL}/?key=${randomKey}\n`;
    message +=
      // `<a href="https://jamesbot.ai">Website</a> | <a href="https://twitter.com/jamesbot_ai">Twitter</a> | <a href="https://docs.jamesbot.ai/">Docs</a>\n`;
      `<a href="https://jamesbot.ai">Website</a> | <a href="https://twitter.com/jamesbot_ai">Twitter</a> | <a href="https://docs.jamesbot.ai/">Docs</a> | <a href="${process.env.LAUNCHPAD_URL}?key=${randomKey}">Launchpad</a>\n`;

    // console.log("2", { chains, chainused });

    // bot send message
    bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Open James App`,
              web_app: {
                url: `${process.env.FE_BASE_URL}/?key=${randomKey}`
              }
            },
          ],
          [
            {
              text: "Buy Token",
              callback_data: BUY_TOKEN_CALLBACK_DATA,
            },
            {
              text: "Sell Token",
              callback_data: SELL_TOKEN_CALLBACK_DATA,
            },
            // {
            //   text: "\uD83D\uDCE5 Perputual Trade Token",
            //   callback_data: "!perp",
            // },
          ],
          [
            {
              text: "Category Buy",
              callback_data: COINGECKO_CATEGORY_CALLBACK_DATA,
            },
          ],
          [
            {
              text: "Trade Perpetuals",
              callback_data: "!perpetual",
            },
            // {
            //   text: "Short Position",
            //   callback_data: "!perpetual:short",
            // },
          ],
          [
            {
              text: "Copy Trade",
              callback_data: "!copytrade",
            },
            {
              text: "Token Snipe",
              callback_data: "!snipetoken",
            },
          ],
          [
            {
              text: `🔄 ${chains[chainused].text}`,
              callback_data: "!selectchain",
            },
          ],
          [
            {
              text: "🏆 Points",
              callback_data: "!point",
            },
            {
              text: "⚙️ Settings",
              callback_data: "!setting",
            },
          ],
        ],
      },
    });
    await redis.SET(msg.chat.id + CHECK_WALLET, "true");
  } catch (err) {
    // error logging
    logger.error("BEGIN ERROR: " + err);

    // the message to return
    const message = "\uD83D\uDD34 Error: Please try again later.";

    // bot send message
    bot.sendMessage(msg.chat.id, message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 MENU",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
          ],
        ],
      },
    });
  }
};
