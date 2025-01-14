const { MENU_KEYBOARD_CALLBACK_DATA } = require("../../constants/buytoken");
const {
  VELA_ORDER_CHAIN,
  VELA_ORDER_IS_LONG,
  VELA_ASSET_ID,
  VELA_ORDER_POSITION,
  VELA_ORDER_COLLATERAL_ID,
  VELA_ORDER_AMOUNT,
  VELA_ORDER_SLIPPAGE,
  VELA_ORDER_LIMIT_PRICE,
  VELA_ORDER_STOP_PRICE,
  VELA_TAKE_PROFIT_TOGGLE,
  VELA_STOP_LOSS_TOGGLE,
  VELA_TAKE_PROFIT_VALUE,
  VELA_STOP_LOSS_VALUE,
  VELA_SUPPORTED_CHAINS,
} = require("../../constants/vela");
const velaCreateOrder = require("../../helpers/vela/createOrder");
const velaCreateOrderTPSL = require("../../helpers/vela/createOrderTPSL");

module.exports = async ({ bot, redis, msg }) => {
  // fetch all the necessary variables
  const currentChain = Number(await redis.GET(msg.chat.id + VELA_ORDER_CHAIN));
  const isLong = JSON.parse(await redis.GET(msg.chat.id + VELA_ORDER_IS_LONG));
  const tokenId = JSON.parse(await redis.GET(msg.chat.id + VELA_ASSET_ID));
  const position = await redis.GET(msg.chat.id + VELA_ORDER_POSITION);
  const collateralAmount = await redis.GET(
    msg.chat.id + VELA_ORDER_COLLATERAL_ID
  );
  const orderAmount = await redis.GET(msg.chat.id + VELA_ORDER_AMOUNT);
  const slippageAmount = await redis.GET(msg.chat.id + VELA_ORDER_SLIPPAGE);
  const limitPrice = await redis.GET(msg.chat.id + VELA_ORDER_LIMIT_PRICE);
  const stopPrice = await redis.GET(msg.chat.id + VELA_ORDER_STOP_PRICE);
  const takeProfit = JSON.parse(
    await redis.GET(msg.chat.id + VELA_TAKE_PROFIT_TOGGLE)
  );
  const stopLoss = JSON.parse(
    await redis.GET(msg.chat.id + VELA_STOP_LOSS_TOGGLE)
  );
  const takeProfitValue = await redis.GET(msg.chat.id + VELA_TAKE_PROFIT_VALUE);
  const stopLossValue = await redis.GET(msg.chat.id + VELA_STOP_LOSS_VALUE);

  // loading message
  const thisMessage = await bot.sendMessage(
    msg.chat.id,
    "\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.",
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }
  );

  let transaction;
  if (takeProfit || stopLoss) {
    // create the order
    transaction = await velaCreateOrderTPSL(
      // chatId,
      msg.chat.id,
      // chainId,
      currentChain.toString(),
      // tokenId,
      tokenId.toString(),
      // isLong,
      isLong,
      // positionType,
      position,
      // collateral,
      collateralAmount,
      // size,
      orderAmount,
      takeProfit,
      stopLoss,
      // slippage = "1",
      slippageAmount,
      // takeProfitValue = null,
      takeProfitValue,
      // stopLossValue = null,
      stopLossValue,
      // limitPrice = null,
      limitPrice,
      // stopPrice = null
      stopPrice
    );
  } else {
    // create the order
    transaction = await velaCreateOrder(
      // chatId,
      msg.chat.id,
      // chainId,
      currentChain.toString(),
      // tokenId,
      tokenId.toString(),
      // isLong,
      isLong,
      // positionType,
      position,
      // collateral,
      collateralAmount,
      // size,
      orderAmount,
      // slippage = "1",
      slippageAmount,
      // limitPrice = null,
      limitPrice,
      // stopPrice = null
      stopPrice
    );
  }

  bot.deleteMessage(msg.chat.id, thisMessage.message_id);

  const chains = structuredClone(VELA_SUPPORTED_CHAINS);
  let txScanner = "";
  for (let i = 0; i < chains.length; i++) {
    if (chains[i].chain_id === currentChain) {
      txScanner = chains[i].chain_scanner;
      break;
    }
  }

  // send success message
  await bot.sendMessage(
    msg.chat.id,
    `\uD83D\uDFE2 Success <a href="${txScanner}/tx/${transaction}"> <strong>Explorer</strong></a>`,
    {
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
    }
  );

  // clear user choices on successful order placed
  await redis.DEL(msg.chat.id + VELA_ORDER_CHAIN);
  await redis.DEL(msg.chat.id + VELA_ORDER_IS_LONG);
  await redis.DEL(msg.chat.id + VELA_ASSET_ID);
  await redis.DEL(msg.chat.id + VELA_ORDER_POSITION);
  await redis.DEL(msg.chat.id + VELA_ORDER_COLLATERAL_ID);
  await redis.DEL(msg.chat.id + VELA_ORDER_AMOUNT);
  await redis.DEL(msg.chat.id + VELA_ORDER_SLIPPAGE);
  await redis.DEL(msg.chat.id + VELA_ORDER_LIMIT_PRICE);
  await redis.DEL(msg.chat.id + VELA_ORDER_STOP_PRICE);

  await redis.DEL(msg.chat.id + VELA_TAKE_PROFIT_TOGGLE);
  await redis.DEL(msg.chat.id + VELA_TAKE_PROFIT_VALUE);
  await redis.DEL(msg.chat.id + VELA_STOP_LOSS_TOGGLE);
  await redis.DEL(msg.chat.id + VELA_STOP_LOSS_VALUE);
};
