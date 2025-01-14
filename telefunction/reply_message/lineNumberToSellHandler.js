const { BigNumber } = require("ethers");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  PRIVATE_SELECT,
} = require("../../constants/buytoken");
const {
  SELL_OPTIONS_ID,
  SELL_TOKEN_CALLBACK_DATA,
} = require("../../constants/selltoken");
const { sellTokenForETH1Inch } = require("../../helpers");
const { tokenErrorHandler } = require("../../helpers/tokenErrorHandler");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const getTokenAddress = require("../../databases/getTokenAddress");
const sellTokenHera = require("../../helpers/sellHera");
const sellTokenOpenOcean = require("../../helpers/sell-openOcean");
const sellTokenJupiter = require("../../helpers/solana/sell-Jupiter");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");
const logger = require("../../helpers/logger");
const {
  openOceanSwapQuote,
  oneInchSwapQuote,
  jupiterSwapQuote,
} = require("../../helpers/tokenPrice");
const { PublicKey } = require("@solana/web3.js");
const { getCoinInfoByAddress } = require("../../apis/coingecko");
const roundTo = require("round-to");

module.exports = async ({
  bot,
  redis,
  msg,
  ethers,
  getWallet,
  token_list,
  chains,
}) => {
  //
  // console.log("SELECTION: ", msg.text);
  // console.log("LIST: ", token_list[msg.chat.id]);

  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  let nativeToken;
  let addressTokenTo = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      addressTokenTo = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
      break;
    case 4:
      nativeToken = "SOL";
      addressTokenTo = "So11111111111111111111111111111111111111112";
      break;
    default:
      nativeToken = "ETH";
  }

  //
  if (
    isNaN(Number(msg.text)) ||
    Number(msg.text) < 1 ||
    Number(msg.text) > token_list[msg.chat.id]?.length
  ) {
    // the message to return
    const message = "\uD83D\uDD34 Error: Not on list.";

    //
    bot.deleteMessage(msg.chat.id, msg.message_id);
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
  } else {
    //
    if (token_list[msg.chat.id]) {
      //
      let amount = 0;
      let percent = 0;
      let slippage = 0;

      //
      let sellOpts = JSON.parse(await redis.GET(msg.chat.id + SELL_OPTIONS_ID));

      //
      const addressFrom =
        token_list[msg.chat.id][Number(msg.text) - 1].token_address;

      //
      let tokenUsed = nativeToken;
      let unitName = token_list[msg.chat.id][Number(msg.text) - 1].decimals;
      if (sellOpts.reply_markup.inline_keyboard[2][1].text.includes("\u2705")) {
        tokenUsed = "USDT";
        // unitName = 6;
        addressTokenTo = await getTokenAddress(chainused, tokenUsed);
      }
      if (sellOpts.reply_markup.inline_keyboard[2][2].text.includes("\u2705")) {
        tokenUsed = "USDC";
        // unitName = 6;
        addressTokenTo = await getTokenAddress(chainused, tokenUsed);
      }

      sellOpts?.reply_markup.inline_keyboard[4].forEach((x) => {
        if (x.text.includes("\u2705")) {
          percent = Number(x.text.split("%")[0]);
        }
      });

      sellOpts.reply_markup.inline_keyboard[8].forEach((x) => {
        if (x.text.includes("\u2705")) {
          slippage = Number(x.text.split("%")[0]);
        }
      });
      //
      if (percent === 0) {
        sellOpts?.reply_markup.inline_keyboard[5].forEach((x) => {
          if (x.text.includes("\u2705")) {
            percent = Number(x.text.split("%")[0]);
          }
        });
      }

      //
      if (percent === 0) {
        percent = Number(
          sellOpts?.reply_markup.inline_keyboard[6][0].text.split("%")[0]
        );
      }

      //
      if (Number(percent) === 100) {
        //
        amount = ethers.utils
          .formatUnits(
            token_list[msg.chat.id][Number(msg.text) - 1].balance.toString(),
            unitName
          )
          .toString();
        // Number(
        //   token_list[msg.chat.id][Number(msg.text) - 1].balance
        // ) *
        // 10 **
        // (
        //   -1 *
        //   token_list[msg.chat.id][Number(msg.text) - 1].decimals
        // ).toString();
      } else {
        //
        amount = (
          (Number(percent) / 100) *
          Number(token_list[msg.chat.id][Number(msg.text) - 1].balance) *
          10 ** (-1 * unitName)
        ).toString();
      }

      if (
        amount.includes(".") &&
        amount.split(".")[1].length > 6 &&
        unitName === 6
      ) {
        amount = roundTo(Number(amount), 6).toString();
      }

      // console.log({ amount });

      //
      const wallet_pk = await getWallet(
        msg.chat.id,
        token_list[msg.chat.id][Number(msg.text) - 1].wallet,
        chainused
      );

      //
      let the_wallet = null;
      if (chainused !== 4) {
        the_wallet = new ethers.Wallet(wallet_pk);
      } else {
        // const keypair = createWalletFromPrivateKey(wallet_pk);
        const accounts = await wallet_pk.requestAccounts();
        const publicKey = new PublicKey(accounts[0]);
        the_wallet = publicKey.toBase58();
      }

      const isPrivate = JSON.parse(
        await redis.GET(msg.chat.id + PRIVATE_SELECT + "sell")
      );

      //
      let amountReceived;
      try {
        switch (chainused) {
          case 3:
            const quoteResponse = await openOceanSwapQuote(
              chainused,
              addressFrom,
              addressTokenTo,
              amount,
              slippage
            );

            amountReceived = {
              toAmount: quoteResponse.data.outAmount,
              toToken: {
                name: quoteResponse.data.outToken.name,
                decimals: quoteResponse.data.outToken.decimals,
                address: quoteResponse.data.outToken.address,
              },
            };
            break;
          case 4:
            const amountInLamport = roundTo(amount * 10 ** 9, 0);
            const jupiterResponse = await jupiterSwapQuote(
              addressFrom,
              addressTokenTo,
              amountInLamport,
              slippage
            );

            // find to token info
            const tokenInfo = await getCoinInfoByAddress(
              chainused,
              addressTokenTo
            );

            //
            let formattedOutAmount = Number(jupiterResponse.outAmount) / 1000;

            amountReceived = {
              toAmount: formattedOutAmount,
              ...tokenInfo,
            };
          // console.log({ amountReceived });
          default:
            amountReceived = await oneInchSwapQuote(
              chainused,
              addressFrom,
              addressTokenTo,
              ethers.utils.parseUnits(amount.toString(), unitName)
            );
          // console.log({ amountReceived });
        }
      } catch (e) {
        logger.error("API QUOTE ERROR: " + e.message);
      }

      const received = formatNumber(
        Number(amountReceived.toAmount) *
          10 ** (-1 * Number(amountReceived.toToken.decimals))
      );

      // console.log({ received });

      // console.log({
      //   chainused,
      //   wallet_pk,
      //   token: token_list[msg.chat.id][Number(msg.text) - 1].token_address,
      //   amount,
      //   slippage,
      //   isPrivate,
      //   addressTokenTo,
      // });

      //
      let response;
      try {
        let message = `[<a href="${chains[chainused].chain_scanner}/address/${
          the_wallet.address
        }">Wallet-${
          token_list[msg.chat.id][Number(msg.text) - 1].wallet
        }</a>]\n`;
        message += `\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`;
        message += `<strong>Sold:</strong> ${formatNumber(amount)} ${
          token_list[msg.chat.id][Number(msg.text) - 1].symbol
        }\n`;
        message += `<strong>Received:</strong> ${formatNumber(
          received
        )} ${tokenUsed}\n\n`;
        //
        bot.deleteMessage(msg.chat.id, msg.message_id);
        const sellPendingMsg = await bot.sendMessage(msg.chat.id, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\uD83D\uDCB8 Sell More",
                  callback_data: SELL_TOKEN_CALLBACK_DATA,
                },
                {
                  text: "\u2261 Menu",
                  callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                },
              ],
            ],
          },
        });
        // console.log({ sellPendingMsg: sellPendingMsg.message_id });
        await redis.SET(
          msg.chat.id + "_sellPendingMsg",
          sellPendingMsg.message_id
        );

        switch (chainused) {
          case 3:
            // response = await sellTokenHera(
            //   chainused,
            //   wallet_pk,
            //   token_list[msg.chat.id][Number(msg.text) - 1].token_address,
            //   amount,
            //   slippage,
            //   isPrivate,
            //   msg,
            //   Number(token_list[msg.chat.id][Number(msg.text) - 1].wallet),
            //   redis,
            //   addressToken
            // );
            response = await sellTokenOpenOcean(
              chainused,
              wallet_pk,
              token_list[msg.chat.id][Number(msg.text) - 1].token_address,
              amount,
              slippage,
              isPrivate,
              msg,
              Number(token_list[msg.chat.id][Number(msg.text) - 1].wallet),
              chains,
              redis,
              addressTokenTo === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                ? null
                : addressTokenTo
            );
            break;
          case 4:
            response = await sellTokenJupiter(
              chainused,
              wallet_pk,
              token_list[msg.chat.id][Number(msg.text) - 1].token_address,
              amount,
              slippage,
              isPrivate,
              msg,
              Number(token_list[msg.chat.id][Number(msg.text) - 1].wallet),
              chains,
              redis,
              addressTokenTo === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                ? null
                : addressTokenTo
            );
            break;
          default:
            response = await sellTokenForETH1Inch(
              chainused,
              wallet_pk,
              token_list[msg.chat.id][Number(msg.text) - 1].token_address,
              amount,
              slippage,
              isPrivate,
              msg,
              Number(token_list[msg.chat.id][Number(msg.text) - 1].wallet),
              redis,
              addressTokenTo === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                ? null
                : addressTokenTo
            );
        }
      } catch (err) {
        response = null;
        const errMessage = err?.response?.data?.description ?? err?.message;

        await tokenErrorHandler(errMessage, bot, msg, redis);
      }

      //
      if (response) {
        if (response.hash) {
          //
          let message = `[<a href="${chains[chainused].chain_scanner}/address/${
            the_wallet.address
          }">Wallet-${
            token_list[msg.chat.id][Number(msg.text) - 1].wallet
          }</a>]\n\uD83D\uDFE2 <strong>Success</strong>\n\n`;
          message += `<strong>Sold:</strong> ${formatNumber(amount)} ${
            token_list[msg.chat.id][Number(msg.text) - 1].symbol
          }\n`;
          message += `<strong>Received:</strong> ${formatNumber(
            received
          )} ${tokenUsed}\n\n`;
          message += `<a href="${chains[chainused].chain_scanner}/tx/${
            response.hash
          }">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20sold%20${formatNumber(
            amount
          )}%20${
            token_list[msg.chat.id][Number(msg.text) - 1].symbol
          }%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>\n\n`;

          const sellPendingMsg = await redis.GET(
            msg.chat.id + "_sellPendingMsg"
          );
          const sellListMsg = await redis.GET(msg.chat.id + "_sell-list");
          await redis.DEL(msg.chat.id + "_sellPendingMsg");
          await redis.DEL(msg.chat.id + "_sell-list");

          //
          bot.deleteMessage(msg.chat.id, Number(sellPendingMsg));
          bot.deleteMessage(msg.chat.id, Number(sellListMsg));
          bot.sendMessage(msg.chat.id, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "\uD83D\uDCB8 Sell More",
                    callback_data: SELL_TOKEN_CALLBACK_DATA,
                  },
                  {
                    text: "\u2261 Menu",
                    callback_data: MENU_KEYBOARD_CALLBACK_DATA,
                  },
                ],
              ],
            },
          });
        } else {
          //
          let message = `[<a href="${chains[chainused].chain_scanner}/address/${
            the_wallet.address
          }">Wallet-${
            token_list[msg.chat.id][Number(msg.text) - 1].wallet
          }</a>]\n\uD83D\uDD34 <strong>Error:</strong> ${response.error}`;

          //
          const sellPendingMsg = await redis.GET(
            msg.chat.id + "_sellPendingMsg"
          );
          const sellListMsg = await redis.GET(msg.chat.id + "_sell-list");
          await redis.DEL(msg.chat.id + "_sellPendingMsg");
          await redis.DEL(msg.chat.id + "_sell-list");

          //
          bot.deleteMessage(msg.chat.id, Number(sellPendingMsg));
          bot.deleteMessage(msg.chat.id, Number(sellListMsg));
          bot.sendMessage(msg.chat.id, message, {
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
              ],
            },
          });
        }
      }
      // else {
      //   //
      //   let message = `[<a href="${chains[chainused].chain_scanner}/address/${
      //     the_wallet.address
      //   }">Wallet-${
      //     token_list[msg.chat.id][Number(msg.text) - 1].wallet
      //   }</a>]\n\uD83D\uDD34 Error: Please try again later.`;

      //   //
      //   bot.deleteMessage(msg.chat.id, msg.message_id);
      //   bot.sendMessage(msg.chat.id, message, {
      //     parse_mode: "HTML",
      //     disable_web_page_preview: true,
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
      // the message to return
      const message = "\uD83D\uDD34 Error: Please try again later.";

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);
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
};
