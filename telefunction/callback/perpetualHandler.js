module.exports = async ({
  msg,
  getVelaApiKey,
  setShowVelaApiOptions,
  setShowVelaOrderOptions,
}) => {
  // check if user has a vela API key
  const velaApiKey = await getVelaApiKey(msg.chat.id);
  if (velaApiKey?.chatid && velaApiKey.chatid === msg.chat.id.toString()) {
    // showVelaOrderOptions = true;
    setShowVelaOrderOptions(true);
  } else {
    // showVelaApiOptions = true;
    setShowVelaApiOptions(true);
  }
};
