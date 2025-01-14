const { VELA_TAKE_PROFIT_TOGGLE } = require("../../constants/vela");

module.exports = async ({ setShowVelaOrderOptions, redis, msg }) => {
  //   showVelaOrderOptions = true;
  setShowVelaOrderOptions(true);
  const currentTakeProfitToggle = JSON.parse(
    await redis.GET(msg.chat.id + VELA_TAKE_PROFIT_TOGGLE)
  );

  await redis.SET(
    msg.chat.id + VELA_TAKE_PROFIT_TOGGLE,
    // if toggle is null, set true
    currentTakeProfitToggle === null
      ? "true"
      : // if toggle is set, do the opposite
      currentTakeProfitToggle
      ? "false"
      : "true"
  );
};
