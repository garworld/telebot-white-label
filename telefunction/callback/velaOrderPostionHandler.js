const { VELA_ORDER_POSITION } = require("../../constants/vela");

module.exports = async ({ setShowVelaOrderOptions, action, redis, msg }) => {
  //   showVelaOrderOptions = true;
  setShowVelaOrderOptions(true);
  const positionType = action.split(":")[1];

  await redis.SET(msg.chat.id + VELA_ORDER_POSITION, positionType);
};
