const {
  COINGECKO_NETWORK,
  COINGECKO_CATEGORY_UPDATE_NETWORK,
} = require("../../../constants/coingecko");

module.exports = async ({
  action,
  redis,
  setShowCoingeckoCategoryOptions,
  msg,
}) => {
  // handle network update here
  const network = action.replace(COINGECKO_CATEGORY_UPDATE_NETWORK, "");

  await redis.SET(msg.chat.id + COINGECKO_NETWORK, network);

  //   showCoingeckoCategoryOptions = true;
  setShowCoingeckoCategoryOptions(true);
};
