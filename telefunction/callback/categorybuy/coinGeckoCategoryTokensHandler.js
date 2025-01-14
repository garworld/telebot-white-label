const { CHAIN_USED } = require("../../../constants/buytoken");
const {
  COINGECKO_CATEGORY_TOKENS_CALLBACK,
  COINGECKO_CATEGORY_NAME,
  COINGECKO_CATEGORY_ID,
} = require("../../../constants/coingecko");

module.exports = async ({
  redis,
  action,
  msg,
  setShowCoingeckoCategoryOptions,
}) => {
  // setup default settings
  // const slippage = "0.5";
  const chainUsed = (await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  // await redis.SET(msg.chat.id + COINGECKO_SLIPPAGE, slippage);
  // await redis.SET(msg.chat.id + COINGECKO_NETWORK, network);
  // await redis.SET(msg.chat.id + COINGECKO_WALLET_INDEX, 0);

  // save category info for
  const info = action
    .replace(COINGECKO_CATEGORY_TOKENS_CALLBACK, "")
    .split("/");

  const categoryName = info[1];
  const categoryId = info[0];

  await redis.SET(
    msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED,
    `${categoryName}/${chainUsed}`
  );
  await redis.SET(
    msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED,
    `${categoryId}/${chainUsed}`
  );

  setShowCoingeckoCategoryOptions(true);
};
