const { ethers } = require("ethers");

const summary = require("../../summary");
const {
  BUY_OPTIONS_ID,
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../../constants/buytoken");

const {
  COINGECKO_ADDRESS_TOKENS,
  COINGECKO_CONTINUE_CALLBACK_DATA,
  COINGECKO_BUY_SUMMARY,
} = require("../../../constants/coingecko");

const {
  moralisDetails,
  oneInchSwapQuote,
  heraSwapQuote,
  openOceanSwapQuote,
  jupiterSwapQuote,
} = require("../../../helpers/tokenPrice");
const roundTo = require("round-to");
const { logger } = require("../../../helpers");
const { formatNumber } = require("../../../helpers/abbreviateNumber");
const getTokenAddress = require("../../../databases/getTokenAddress");
const { getCoinInfoByAddress } = require("../../../apis/coingecko");
const getWallet = require("../../../databases/getWallet");

module.exports = async ({ bot, msg, redis }) => {
  // delete previous message - display swap summary
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  await redis.SET(
    msg.chat.id + BUY_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );
  // buy_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  const chainUsed = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  let addressToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  switch (chainUsed) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      addressToken = "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000";
      break;
    case 4:
      nativeToken = "SOL";
      addressToken = "So11111111111111111111111111111111111111112";
      break;
    default:
      nativeToken = "ETH";
  }

  // get token address
  const tokenAddresses = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_ADDRESS_TOKENS)
  );

  //
  const buy_options = JSON.parse(await redis.GET(msg.chat.id + BUY_OPTIONS_ID));

  //
  let tokenUsed = nativeToken;
  let unitName = "ether";
  if (buy_options.reply_markup.inline_keyboard[4][1].text.includes("\u2705")) {
    tokenUsed = "USDT";
    unitName = "mwei";
    addressToken = await getTokenAddress(chainUsed, tokenUsed);
  }

  if (buy_options.reply_markup.inline_keyboard[4][2].text.includes("\u2705")) {
    tokenUsed = "USDC";
    unitName = "mwei";
    addressToken = await getTokenAddress(chainUsed, tokenUsed);
  }

  await redis.SET(
    msg.chat.id + "_buywithaddress",
    JSON.stringify([addressToken, tokenUsed])
  );

  // get amount and slippage
  let amount = 0.0;
  let walletIndexes = [];
  let slippage = 0.0;

  buy_options.reply_markup.inline_keyboard[6].forEach((y) => {
    if (y.text.includes("\u2705")) {
      amount = Number(y.text.split(` ${tokenUsed}`)[0]);
    }
  });
  buy_options.reply_markup.inline_keyboard[9].forEach((y) => {
    if (y.text.includes("\u2705")) {
      slippage = Number(y.text.split("%")[0]);
    }
  });

  buy_options.reply_markup.inline_keyboard[2].forEach((x, i) => {
    if (x.text.includes("\u2705")) {
      walletIndexes.push(i);
    }
  });
  //
  if (amount === 0.0) {
    amount = buy_options.reply_markup.inline_keyboard[7][0].text.split(
      ` ${tokenUsed}`
    )[0];
  }
  const splitAmount = amount.toString().includes("003")
    ? parseFloat((amount / (tokenAddresses.length / 2)).toFixed(6))
    : amount / (tokenAddresses.length / 2);

  // get wallet address
  // const wallet = await getWallet(msg.chat.id, walletIndexes[0] + 1);
  // const walletaddress = new ethers.Wallet(wallet).address;

  const getDetails = (token, sAmount) => {
    return new Promise(async (resolve) => {
      // let tokenDecimals, res;
      try {
        // let tokenDecimals = await moralisDetails(chainUsed, token.address);
        let tokenDecimals = await getCoinInfoByAddress(
          chainUsed,
          token.address
        );
        let res;
        switch (chainUsed) {
          case 3:
            // const heraResponse = await heraSwapQuote(
            //   chainUsed,
            //   addressToken,
            //   token.address,
            //   ethers.utils.parseUnits(sAmount.toString(), unitName),
            //   walletaddress
            // );
            // console.log({ heraResponse });
            // if (heraResponse == "") {
            //   break;
            // }

            //
            const quoteResponse = await openOceanSwapQuote(
              chainUsed,
              addressToken,
              token.address,
              sAmount,
              slippage
            );

            // console.log('OPEN OCEAN QUOTE: ', { toAmount: quoteResponse.data.outAmount });

            res = {
              toAmount: quoteResponse.data.outAmount,
            };
            break;
          case 4:
            const amountInLamport = sAmount * 10 ** 9;
            const jupiterResponse = await jupiterSwapQuote(
              addressToken,
              token.address,
              amountInLamport,
              slippage
            );
            res = {
              toAmount: jupiterResponse.outAmount,
            };
            break;
          default:
            res = await oneInchSwapQuote(
              chainUsed,
              addressToken,
              token.address,
              ethers.utils.parseUnits(sAmount.toString(), unitName)
            );
        }

        // const theDec = ethers.BigNumber.from(Number(tokenDecimals?.toToken?.decimals));
        // const thePow = ethers.BigNumber.from(10).pow(theDec);
        // const theRec = ethers.BigNumber.from(res?.toAmount).div(thePow).toString();

        const received = roundTo(
          Number(res?.toAmount) *
            10 ** (-1 * Number(tokenDecimals?.toToken?.decimals)),
          3
        );

        // console.log({
        //   received, theDec: theDec.toString(), thePow: thePow.toString(), toAmount: res?.toAmount, theRec
        // });

        // return { token, res };
        resolve(received);
      } catch (error) {
        // console.error("ERROR COIN GECKO CUSTOM ADDRESS HANDLER: ", error.message);
        logger.error("TOKEN PRICE MORALIS DETAILS ERROR: " + error.message);
        // return { token: JSON.stringify(token), error: JSON.stringify(error) };
        resolve("Price Not Found for ");
      }
    });
  };

  // let amountReceived = tokenAddresses.map(async (token) => await getDetails(token, splitAmount));
  // amountReceived = await Promise.all([amountReceived]);
  let amountReceived = [];

  let dIdx = 0;
  let next = async (t, s) => {
    if (dIdx < tokenAddresses.length) {
      amountReceived = [...amountReceived, await getDetails(t, s)];
      dIdx += 1;
      await next(tokenAddresses[dIdx], s);
    }
  };

  await next(tokenAddresses[dIdx], splitAmount);

  let tokenReceived = [];

  const categoryBuySummary = {
    amount: splitAmount,
    tokenAddresses: tokenAddresses
      .filter((t, i) => {
        // console.log({ received: amountReceived[i] });
        if (amountReceived[i].toString().includes("Price Not Found")) {
          return false;
        }
        if (amountReceived[i] === 0) {
          return false;
        }
        tokenReceived = [
          ...tokenReceived,
          {
            symbol: t.symbol,
            address: t.address,
            received: amountReceived[i],
          },
        ];
        return true;
      })
      .slice(0, 5),
    walletIndexes,
    amountReceived: amountReceived
      .filter((a) => {
        if (a.toString().includes("Price Not Found")) {
          return false;
        }
        if (a === 0) {
          return false;
        }
        return true;
      })
      .slice(0, 5),
    slippage,
  };

  // console.log({ categoryBuySummary });

  await redis.SET(
    msg.chat.id + COINGECKO_BUY_SUMMARY,
    JSON.stringify(categoryBuySummary)
  );

  // // get tokens
  // const tokens = JSON.parse(
  //   await redis.GET(msg.chat.id + COINGECKO_ADDRESS_TOKENS)
  // );

  // console.log({ tokens });

  let message = await summary(msg);
  message += "<strong>Swap Summary</strong>\n";

  // const listTokens = tokens.map((t) => t.symbol.toUpperCase());
  tokenReceived.slice(0, 5).map((t, idx) => {
    const token = t.symbol.toUpperCase();
    message += `${idx + 1}. ${token}\n`;
    message += `    ${splitAmount} ${tokenUsed} ➜ ${formatNumber(
      t.received
    )} ${token}\n`;
  });
  message += "----------------------------\n";
  message += "<strong>Do you want to continue?</strong>";

  const message_options = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Yes, Continue",
            callback_data: COINGECKO_CONTINUE_CALLBACK_DATA,
          },
          {
            text: "No, Cancel",
            callback_data: MENU_KEYBOARD_CALLBACK_DATA,
          },
        ],
      ],
    },
  };

  bot.sendMessage(msg.chat.id, message, message_options);
};
