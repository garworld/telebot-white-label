module.exports = () => {
  //
  let message = "<strong><a href=\"https://t.me/BobbyBuyBot\">Bobby Buy Bot (BBB)</a> Settings</strong>\n";
  message += "----------------------------\n";
  message += "1. Select which wallet(s) you wish to use.\n";
  message += "2. Select your preferred base currency.\n";
  message += "(Native Coin: ETH / AVAX / SOL / etc)\n";
  message += "3. Select your buy amount in USD value.\n";
  message += "(Will be converted based on base currency)\n";
  message += "4. Select slippage.\n";
  message += "----------------------------\n";
  message += "<i>Buy tokens with a simple click on BBB’s posts.</i>\n";
  message += "<i>Warning: The bot will buy without confirmation upon clicking.</i>\n";
  message += "<i>Learn more</i>";

  return message;
};
