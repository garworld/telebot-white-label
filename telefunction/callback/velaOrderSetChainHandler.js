const { VELA_ORDER_CHAIN } = require("../../constants/vela");

module.exports = async ({ setShowVelaOrderOptions, action, redis, msg }) => {
  //   showVelaOrderOptions = true;
  setShowVelaOrderOptions(true);
  const chainId = action.split(":")[1];

  await redis.SET(msg.chat.id + VELA_ORDER_CHAIN, chainId);
};
