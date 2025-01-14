const { activities } = require("@prisma/client");
const { ethers } = require("ethers");
const {
  COINGECKO_SUPPORTED_CHAINS,
  COINGECKO_CATEGORY_NAME,
  COINGECKO_BUY_SUMMARY,
} = require("../../../constants/coingecko");
const { buyTokenUseETH1Inch } = require("../../../helpers");
const {
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
  PRIVATE_SELECT,
} = require("../../../constants/buytoken");
const { formatNumber } = require("../../../helpers/abbreviateNumber");
const checkFirst = require("../../../databases/checkFirst");
const { getActivityPoint } = require("../../../databases");
const { DATA_CHAIN_LIST } = require("../../../constants/chains");
const buyTokenHera = require("../../../helpers/buyHera");
const buyOpenOcean = require("../../../helpers/buy-openOcean");
const buyTokenJupiter = require("../../../helpers/solana/buy-Jupiter");
const updatePoint = require("../../../databases/updatePoint");

module.exports = async ({ bot, redis, msg, getWallet }) => {
  //
  // const chainsCache = await redis.GET("chainsCache");
  // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  // const chains = DATA_CHAIN_LIST;

  // Update with loading screen
  let pendingMessageId;
  const updateMenuWithLoadingScreen = async () => {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    const message =
      "\n\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n";
    const message_options = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [[]] },
    };
    const sentMessage = await bot.sendMessage(
      msg.chat.id,
      message,
      message_options
    );
    // await redis.SET(msg.chat.id + "_coingecko_loading", sentMessage.message_id);
    pendingMessageId = sentMessage.message_id;
  };
  await updateMenuWithLoadingScreen();

  const categoryBuySummary = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_BUY_SUMMARY)
  );

  // retrieve info to facilitate buy
  const categoryName = await redis.GET(msg.chat.id + COINGECKO_CATEGORY_NAME);

  const chainUsed = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  switch (chainUsed) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      break;
    case 4:
      nativeToken = "SOL";
      break;
    default:
      nativeToken = "ETH";
  }

  const blockExplorer = COINGECKO_SUPPORTED_CHAINS[chainUsed].chain_scanner;
  let message = "";

  //
  const buyWithAddress = JSON.parse(
    await redis.GET(msg.chat.id + "_buywithaddress")
  );
  // console.log({ buyWithAddress });

  // act on buy
  // loop through all token addresses
  for (const wallet of categoryBuySummary.walletIndexes) {
    const wallet_pk = await getWallet(
      msg.chat.id,
      Number(wallet) + 1,
      chainUsed
    );
    message += `<strong>[Wallet-${wallet + 1}]</strong>\n`;
    message += `<strong>Transactions results for buying category tokens</strong>\n`;
    message += `<strong>Category</strong>: ${categoryName}\n`;
    message += `<strong>Slippage used</strong>: ${categoryBuySummary.slippage}%\n`;
    message += `<strong>Tokens</strong>\n`;

    //
    const isPrivate = JSON.parse(
      await redis.GET(msg.chat.id + PRIVATE_SELECT + "category")
    );

    for (
      let index = 0;
      index < categoryBuySummary.tokenAddresses.length;
      index++
    ) {
      const token = categoryBuySummary.tokenAddresses[index];
      const amountReceived = formatNumber(
        categoryBuySummary.amountReceived[index]
      );

      if (!amountReceived.toString().includes("Price Not Found for")) {
        // send buy order with amount, slippage, chainId, walletPK
        message += `${categoryBuySummary.amount} ${
          buyWithAddress[1]
        } → ${amountReceived} ${token.symbol.toUpperCase()}\n`;
        let buyTransaction;
        switch (chainUsed) {
          case 3:
            // buyTransaction = await buyTokenHera(
            //   chainUsed,
            //   wallet_pk,
            //   token.address,
            //   categoryBuySummary.amount,
            //   categoryBuySummary.slippage, // ini ntar ganti dari gara
            //   isPrivate,
            //   msg,
            //   Number(wallet) + 1,
            //   chains,
            //   redis,
            //   buyWithAddress[1] !== nativeToken ? buyWithAddress[0] : null
            // );
            buyTransaction = await buyOpenOcean(
              chainUsed,
              wallet_pk,
              token.address,
              categoryBuySummary.amount,
              categoryBuySummary.slippage, // ini ntar ganti dari gara
              isPrivate,
              msg,
              Number(wallet) + 1,
              chains,
              redis,
              buyWithAddress[1] !== nativeToken ? buyWithAddress[0] : null
            );
            break;
          case 4:
            buyTransaction = await buyTokenJupiter(
              chainUsed,
              wallet_pk,
              token.address,
              categoryBuySummary.amount,
              categoryBuySummary.slippage, // ini ntar ganti dari gara
              isPrivate,
              msg,
              Number(wallet) + 1,
              chains,
              redis,
              buyWithAddress[1] !== nativeToken ? buyWithAddress[0] : null
            );
            break;
          default:
            buyTransaction = await buyTokenUseETH1Inch(
              chainUsed,
              wallet_pk,
              token.address,
              categoryBuySummary.amount,
              categoryBuySummary.slippage, // ini ntar ganti dari gara
              isPrivate,
              msg,
              Number(wallet) + 1,
              chains,
              redis,
              buyWithAddress[1] !== nativeToken ? buyWithAddress[0] : null
            );
        }

        // Expect all to fail
        if (buyTransaction === null) {
          message += `\uD83D\uDD34 Error: Insufficient ${buyWithAddress[1]} for gas.\n\n`;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else if (buyTransaction.error !== null) {
          message += `\uD83D\uDD34 Error: Insufficient ${buyWithAddress[1]} for gas.\n\n`;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          // success message here
          const href = `${blockExplorer}/tx/${buyTransaction.hash}`;
          message += `\uD83D\uDFE2 Success <a href="${href}">View Tx</a>\n\n`;
        }

        const firstCategory = await checkFirst(
          msg.chat.id,
          activities.FIRSTCATEGORYBUY
        );
        if (firstCategory) {
          const thePoints = await getActivityPoint(activities.FIRSTCATEGORYBUY);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }
      } else {
        message += `${token.symbol.toUpperCase()} is not proceed because no pools found with enough liquidity\n`;
      }
      if (index === 4) {
        message += "\n";
      }
    }
  }

  // update message with success and failure list
  // send back to main menu
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
      ],
    },
  };

  // Remove loading screen
  // const messageId = await redis.GET(msg.chat.id + "_coingecko_loading")
  bot.deleteMessage(msg.chat.id, pendingMessageId);

  bot.sendMessage(msg.chat.id, message, message_options);

  await redis.DEL(msg.chat.id + "_buywithaddress");
};
