const { VELA_STOP_LOSS_TOGGLE } = require("../../constants/vela");

module.exports = async ({ setShowVelaOrderOptions, redis, msg }) => {
  //   showVelaOrderOptions = true;
  setShowVelaOrderOptions(true);
  const currentStopLossToggle = JSON.parse(
    await redis.GET(msg.chat.id + VELA_STOP_LOSS_TOGGLE)
  );

  await redis.SET(
    msg.chat.id + VELA_STOP_LOSS_TOGGLE,
    // if toggle is null, set true
    currentStopLossToggle === null
      ? "true"
      : // if toggle is set, do the opposite
      currentStopLossToggle
      ? "false"
      : "true"
  );
};
