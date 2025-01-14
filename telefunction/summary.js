// dotenv
require("dotenv").config();

const { DATA_CHAIN_LIST } = require("../constants/chains");
// node_modules

// custom modules
const { redis, logger } = require("../helpers");
const { formatNumber } = require("../helpers/abbreviateNumber");

/**
 * summary(msg)
 *
 * @param { object } msg
 * @returns { Promise<string | Error> }
 */
module.exports = (msg) => {
  return new Promise(async (resolve, reject) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));


      // chat id as identifier for bot user
      const chatid = msg.chat.id;

      // get redis stored exchange value and gas tracker
      const chainused = Number(await redis.GET(chatid + "_chain")) || 0;
      const ethusd = await redis.GET("ethusd");
      const avausd = await redis.GET("avausd");
      const metisusd = await redis.GET("metisusd");
      const solusd = await redis.GET("solusd");
      const gas = await redis.GET("gas:" + chainused);
      let gasUnit = "Gwei";
      let nativeToken = "ETH";
      let usdPrice = ethusd;
      switch (chainused) {
        case 2:
          gasUnit = "nAVAX";
          nativeToken = "AVAX";
          usdPrice = avausd;
          break;
        case 3:
          gasUnit = "nMETIS";
          nativeToken = "METIS";
          usdPrice = metisusd;
          break;
        case 4:
          gasUnit = "SOL";
          nativeToken = "SOL";
          usdPrice = solusd;
          break;
      }

      //
      chains[chainused].text += " \u2705";

      // the message to return
      let message = `${nativeToken}: $${formatNumber(
        usdPrice
      )} | Gas: ${formatNumber(gas)} ${gasUnit}\n`;
      message += `Chain: ${chains[chainused].text.replace(
        " \u2705",
        ""
      )}\n----------------------------\n`;

      //
      resolve(message);
    } catch (err) {
      // error logging
      logger.error("SUMMARY ERROR: " + err.message);

      //
      reject(err);
    }
  });
};
