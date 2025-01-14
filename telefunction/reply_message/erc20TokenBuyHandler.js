//
require("dotenv").config();

//
const { default: axios } = require("axios");

//
const {
  BUY_TOKEN_ADDRESS,
  BUY_MESSAGE_MENU,
  BUY_CONTINUE_CALLBACK_DATA,
  BUY_CANCEL_CALLBACK_DATA,
  BUY_OPTIONS_ID,
  BUY_SUMMARY_ID,
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
  // PRIVATE_SELECT,
} = require("../../constants/buytoken");
const {
  moralisDetails,
  oneInchSwapQuote,
  heraSwapQuote,
} = require("../../helpers");
const summary = require("../summary");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const { tokenErrorHandler } = require("../../helpers/tokenErrorHandler");
const { getTokenAddress } = require("../../databases");
const {
  getCoinUsdPrice,
  getCoinInfoByAddress,
} = require("../../apis/coingecko");
const getWallet = require("../../databases/getWallet");
const {
  openOceanSwapQuote,
  jupiterSwapQuote,
} = require("../../helpers/tokenPrice");
const dexGetUsdPrice = require("../../helpers/dexScreener");
const { randomUUID } = require("crypto");

// bbb.3 enter here to buy
module.exports = async ({
  bot,
  redis,
  msg,
  logger,
  ethers,
  chains,
  fromRef,
}) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken = "ETH";
  let addressToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
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
  const buy_options = JSON.parse(await redis.GET(msg.chat.id + BUY_OPTIONS_ID));

  let tokenUsed = nativeToken;
  let unitName = "ether";
  if (buy_options.reply_markup.inline_keyboard[4][1].text.includes("\u2705")) {
    tokenUsed = "USDT";
    unitName = "mwei";
    addressToken = await getTokenAddress(chainused, tokenUsed);
  }
  if (buy_options.reply_markup.inline_keyboard[4][2].text.includes("\u2705")) {
    tokenUsed = "USDC";
    unitName = "mwei";
    addressToken = await getTokenAddress(chainused, tokenUsed);
  }
  //
  const tokenAddressBuy = fromRef
    ? await redis.GET(msg.chat.id + "_fromrefbuy")
    : msg.text;
  fromRef ? await redis.DEL(msg.chat.id + "_fromrefbuy") : null;
  let wallets_to_use = [];
  let amount = 0.0;
  let slippage = 10;

  // debug logging
  // logger.debug("ADDRESS TO BUY: " + msg.text);
  // logger.debug("REPLY MARKUP: " + JSON.stringify(buy_options));
  // logger.debug(
  //   "AMOUNT: " + JSON.stringify(buy_options.reply_markup.inline_keyboard[6])
  // );

  //
  buy_options.reply_markup.inline_keyboard[6].forEach((y) => {
    if (y.text.includes("\u2705")) {
      amount = Number(y.text.split(` ${tokenUsed}`)[0]);
    }
  });

  //
  if (amount === 0.0) {
    logger.debug(
      "BUY OPTS: " + buy_options.reply_markup.inline_keyboard[7][0].text
    );
    amount = buy_options.reply_markup.inline_keyboard[7][0].text.split(
      ` ${tokenUsed}`
    )[0];
  }

  //
  buy_options.reply_markup.inline_keyboard[9].forEach((y) => {
    if (y.text.includes("\u2705")) {
      slippage = Number(y.text.split("%")[0]);
    }
  });

  //
  buy_options.reply_markup.inline_keyboard[2].forEach((y, idx) => {
    if (y.text.includes("\u2705")) {
      wallets_to_use = [...wallets_to_use, idx];
    }
  });

  //
  logger.debug("WALLET TO USE: " + JSON.stringify(wallets_to_use));

  //
  if (wallets_to_use.length > 0) {
    //
    const messageToDelete = await redis.GET(msg.chat.id + BUY_TOKEN_ADDRESS);
    await redis.DEL(msg.chat.id + BUY_TOKEN_ADDRESS);

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    fromRef ? null : bot.deleteMessage(msg.chat.id, msg.message_id);

    //
    // const wallet = await getWallet(
    //   msg.chat.id,
    //   wallets_to_use[0] + 1,
    //   chainused
    // );
    // const walletaddress = new ethers.Wallet(wallet).address;

    //
    let response;
    let usdPrice;

    //
    try {
      usdPrice = await dexGetUsdPrice(tokenAddressBuy);
      switch (chainused) {
        case 3:
          response = await getCoinInfoByAddress(chainused, tokenAddressBuy);
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
                  id: tokenAddressBuy,
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
                address: tokenAddressBuy,
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
            tokenAddressBuy,
            ethers.utils.parseUnits(amount.toString(), unitName)
          );
      }

      // get usd price dari moralis
      // usdPrice = await getCoinUsdPrice(chainused, tokenAddressBuy);
      // console.log({ response });
      // response = await moralisDetails(chainused, tokenAddressBuy);
    } catch (error) {
      response = null;
      const errMessage = error.message;
      await tokenErrorHandler(errMessage, bot, msg, redis);
    }

    //
    // logger.debug("TOKEN SUMMARY: " + JSON.stringify(response));

    //
    if (response) {
      //
      logger.debug("TOKEN SUMMARY: " + JSON.stringify(response));

      // remove buy menu
      const messageBuyMenu = await redis.GET(msg.chat.id + BUY_MESSAGE_MENU);
      await redis.DEL(msg.chat.id + BUY_MESSAGE_MENU);

      await redis.SET(
        msg.chat.id + "_buywithaddress",
        JSON.stringify([addressToken, tokenUsed])
      );

      //
      let amountReceived;
      try {
        switch (chainused) {
          case 3:
            // const heraResponse = await heraSwapQuote(
            //   chainused,
            //   addressToken,
            //   tokenAddressBuy,
            //   ethers.utils.parseUnits(amount.toString(), unitName),
            //   walletaddress
            // );

            // //
            // if (heraResponse == "") {
            //   break;
            // }

            const quoteResponse = await openOceanSwapQuote(
              chainused,
              addressToken,
              tokenAddressBuy,
              amount,
              slippage
            );

            //
            amountReceived = {
              toAmount: quoteResponse.data.outAmount,
            };
            break;
          case 4:
            const amountInLamport = amount * 10 ** 9;
            const jupiterResponse = await jupiterSwapQuote(
              addressToken,
              tokenAddressBuy,
              amountInLamport,
              slippage
            );

            //
            let formattedOutAmount = jupiterResponse.outAmount;
            if (
              addressToken !== "So11111111111111111111111111111111111111112"
            ) {
              formattedOutAmount = Number(jupiterResponse.outAmount) / 1000;
            }
            amountReceived = {
              toAmount: formattedOutAmount,
            };
            break;
          default:
            amountReceived = await oneInchSwapQuote(
              chainused,
              addressToken,
              tokenAddressBuy,
              ethers.utils.parseUnits(amount.toString(), unitName)
            );
        }
      } catch (e) {
        logger.error("API QUOTE ERROR: " + e.message);
      }

      if (amountReceived) {
        //
        // const received = amount / ((Number(response.nativePrice.value) * (10 ** (-1 * Number(response.tokenDecimals)))));
        const received =
          Number(amountReceived.toAmount) *
          10 ** (-1 * Number(response.toToken.decimals));

        const amountReduction = received * 0.01;
        const actualReceived = formatNumber(received - amountReduction);
        //abbreviate number
        const formatPrice = formatNumber(usdPrice);

        let amountIn = ethers.utils.parseUnits(amount.toString(), unitName);
        const platformFee = amountIn.div(100);
        amountIn = amountIn.sub(platformFee);
        const amountFormat = ethers.utils.formatUnits(amountIn, unitName);

        //
        let message = await summary(msg);
        message += "<strong>Swap Summary</strong>\n\n";
        message += `<strong>Buy with:</strong> ${amountFormat} ${tokenUsed}\n`;
        message += `<strong>Slippage:</strong> ${slippage}%\n`;
        message += `<strong>Swap for:</strong> ${actualReceived} ${response.toToken.symbol.toUpperCase()}\n\n`;
        message +=
          "----------------------------\n<strong>Token Details:</strong>\n";
        message += `<strong>Name:</strong> ${response.toToken.name}\n`;
        message += `<strong>Symbol:</strong> ${response.toToken.symbol.toUpperCase()}\n`;
        message += `<strong>Address:</strong> ${response.toToken.address}\n`;
        message += `<strong>Price:</strong> $${formatPrice}\n`;
        message += `<a href="${chains[chainused].chain_scanner}/token/${tokenAddressBuy}">Explorer</a> | <a href="https://www.geckoterminal.com/eth/pools/${tokenAddressBuy}">Chart</a>\n`;
        message += "----------------------------\nDo you want to continue?\n";

        //
        bot.deleteMessage(msg.chat.id, Number(messageBuyMenu));
        bot.sendMessage(msg.chat.id, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Yes, Continue",
                  callback_data: BUY_CONTINUE_CALLBACK_DATA,
                },
                {
                  text: "No, Cancel",
                  callback_data: BUY_CANCEL_CALLBACK_DATA,
                },
              ],
            ],
          },
        });

        //
        // await redis.DEL(msg.chat.id + BUY_OPTIONS_ID);
        await redis.SET(
          msg.chat.id + BUY_SUMMARY_ID,
          JSON.stringify({
            wallets: wallets_to_use,
            amount: amountFormat,
            slippage,
            token_address: tokenAddressBuy,
            token_symbol: response.toToken.symbol.toUpperCase(),
            received: actualReceived,
          })
        );
      } else {
        // remove buy menu
        const messageBuyMenu = await redis.GET(msg.chat.id + BUY_MESSAGE_MENU);
        await redis.DEL(msg.chat.id + BUY_MESSAGE_MENU);

        //
        let message = "\uD83D\uDD34 Error: Please try again later.";

        //
        bot.deleteMessage(msg.chat.id, Number(messageBuyMenu));
        bot.sendMessage(msg.chat.id, message, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u2261 Menu",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
            ],
          },
        });
      }
    }
    //  else {
    //   // remove buy menu
    //   const messageBuyMenu = await redis.GET(msg.chat.id + BUY_MESSAGE_MENU);
    //   await redis.DEL(msg.chat.id + BUY_MESSAGE_MENU);

    //   //
    //   let message =
    //     "\uD83D\uDD34 <strong>Error</strong>: Token contract address not found!\n----------------------------\nPlease make sure you enter the correct address.";

    //   //
    //   bot.deleteMessage(msg.chat.id, Number(messageBuyMenu));
    //   bot.sendMessage(msg.chat.id, message, {
    //     parse_mode: "HTML",
    //     reply_markup: {
    //       inline_keyboard: [
    //         [
    //           {
    //             text: "\u2261 Menu",
    //             callback_data: MENU_KEYBOARD_CALLBACK_DATA,
    //           },
    //         ],
    //       ],
    //     },
    //   });
    // }
  } else {
    //
    await redis.DEL(msg.chat.id + BUY_OPTIONS_ID);

    //
    const messageToDelete = await redis.GET(msg.chat.id + BUY_TOKEN_ADDRESS);
    await redis.DEL(msg.chat.id + BUY_TOKEN_ADDRESS);

    // remove buy menu
    const messageBuyMenu = await redis.GET(msg.chat.id + BUY_MESSAGE_MENU);
    await redis.DEL(msg.chat.id + BUY_MESSAGE_MENU);

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    fromRef ? null : bot.deleteMessage(msg.chat.id, msg.message_id);

    //
    let message =
      "Wallet should be chosen\n----------------------------\nPlease make sure to chose the wallet to use.";

    //
    bot.deleteMessage(msg.chat.id, Number(messageBuyMenu));
    bot.sendMessage(msg.chat.id, message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
          ],
        ],
      },
    });
  }
};
